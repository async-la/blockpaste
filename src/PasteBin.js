import React, { Component } from 'react';
import CryptoJS from 'crypto-js'
import MonacoEditor from 'react-monaco-editor';
import PastePanel from './pastebin/PastePanel';
import SettingsPanel from './pastebin/SettingsPanel';
import { gethAddress, swarmAddress, rootAddress } from './constants/api'

import { CommandBar } from 'office-ui-fabric-react/lib/CommandBar';
import { Dropdown, IDropdown, DropdownMenuItemType, IDropdownOption } from 'office-ui-fabric-react/lib/Dropdown';
import { Panel, PanelType } from 'office-ui-fabric-react/lib/Panel';
import { TextField } from 'office-ui-fabric-react/lib/TextField';

import { getPasteHash, getPasteKey, generatePasteKey } from './utils/pasteHelper'
import _ from 'lodash'

import './PasteBin.css';

const VERSION = 1

const PERSIST_DATA = 'blockpaste:persistData'
const USER_OPTIONS = 'blockpaste:userOptions'

class App extends Component {
  state = {
    content: '',
    description: '',
    editorMounted: false,
    filename: '',
    languages: [],
    mode: 'plaintext',
    pastePanelVisible: false,
    persistOn: true,
    settingsPanelVisible: false,
    options: {
      selectOnLineNumbers: true,
      fontSize: 14,
      automaticLayout: true, // less performant
      lineNumbers: 'on',
      theme: 'vs',
    }
  }

  componentWillMount() {
    if (localStorage[USER_OPTIONS]) {
      this.setState({
        options: JSON.parse(localStorage[USER_OPTIONS])
      })
    }
    this.setState({
      persistOn: localStorage[PERSIST_DATA] === 'true'
    })
  }

  componentDidMount() {
    const pasteHash = getPasteHash()
    if (getPasteHash()) this.getData(pasteHash)
  }

  getOverflowItems() {
      return [
      {
        key: 'pastes',
        name: 'Pastes',
        icon: 'Paste',
        onClick: this.showPastes,
      },
      {
        key: 'settings',
        name: 'Settings',
        icon: 'Settings',
        onClick: this.showSettings,
      },
    ]
  }

  getItems() {
      return [
      {
        key: 'new',
        name: 'New',
        icon: 'CircleAddition',
        onClick: () => window.location.replace(rootAddress),
      },
      {
        key: 'save',
        name: 'Save',
        icon: 'Save',
        onClick: this.save,
      },
      {
        key: 'languages',
        name: 'Syntax',
        onRender: () => (
          <div>
          <Dropdown
            style={{marginTop: 4, width: '200px', textAlign: 'center'}}
            options={this.getSelectBoxOptions()}
            selectedKey={this.state.mode}
            onChanged={this.handleLanguageChange}
          />
        </div>
        )
      },
      this.state.content && {
        key: 'copy',
        name: 'Copy to Clipboard',
        icon: 'Copy',
        onClick: this.copyToClipboard
      },
    ]
  }
  copyToClipboard = () => {
    // Create the textarea input to hold our text.
    const element = document.createElement('textarea');
    element.value = this._editor.getValue();
    // Add it to the document so that it can be focused.
    document.body.appendChild(element);
    // Focus on the element so that it can be copied.
    element.focus();
    element.setSelectionRange(0, element.value.length);
    // Execute the copy command.
    document.execCommand('copy');
    // Remove the element to keep the document clear.
    document.body.removeChild(element);
  }

  showPastes = () => {
    this.setState({ pastePanelVisible: true })
  }

  showSettings = () => {
    this.setState({ settingsPanelVisible: true })
  }

  save = () => {
    const { content, description, filename, mode } = this.state
    if (content.trim().length === 0) return
    const createdAt = Date.now()
    const payload = {
      content,
      description,
      filename,
      mode,
      // meta data
      createdAt,
      schema: VERSION,
    }

    const key = generatePasteKey()
    const encryptedPayload = CryptoJS.AES.encrypt(JSON.stringify(payload), key);
    logger('## encrypted', encryptedPayload.toString())

    const req = new XMLHttpRequest();
    req.open('POST', `${swarmAddress}/bzzr:/`);
    req.onload = event => {
      if (req.status === 200) {
        if (this.state.persistOn) {
          localStorage.setItem(`blockpaste:paste:${createdAt}`, JSON.stringify({
            link: `${req.responseText}#${key}`,
            createdAt,
          }));
        }
        window.location.replace(`${rootAddress}/${req.responseText}#${key}`)
      } else {
        alert(`There was an error saving your snippet'.\nPlease check console logs.`)
      }
    }
    req.send(encryptedPayload);
  }

  getData = (hash) => {
    const req = new XMLHttpRequest();
    req.open('GET', `${swarmAddress}/bzzr:/${hash}`);
    req.onload = (event) => {
      if (req.status === 200) {
        const bytes = CryptoJS.AES.decrypt(req.responseText, getPasteKey());
        const decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
        logger('## decrypted', decryptedData)

        const { content, description, filename, mode } = decryptedData
        this.setState({ content, description, filename, mode })
      } else {
        alert(`There was an error accessing path 'bzz:/${hash}'.\nPlease check console logs.`)
      }
    }
    req.send(null);
  }

  handleInputChange = (event) => {
    const { name, value } = event.target
    this.setState({ [name]: value })
  }

  handleLanguageChange = (event) => {
    const { key } = event
    this.setState({ mode: key })
  }

  editorDidMount = (editor, monaco) => {
    const languages = _.sortBy(monaco.languages.getLanguages(), 'id')

    this._editor = editor
    this._editor.focus()
    this.setState({ languages, editorMounted: true })

  }

  getCurrentLanguage() {
    return this.state.mode
  }

  getSelectBoxOptions() {
    return this.state.languages.map(lang => {
      const alias = lang.aliases[0] === 'sol' ? 'Solidity' : lang.aliases[0]
      return { key: lang.id, text: alias }
    })
  }

  onChangeTheme = theme => {
    this.setState(prevState => ({
      options: {
        ...prevState.options,
        theme,
      }
    }), this.updateStoredOptions)
  }

  onChangeLineNubmersOn = lineNumbers => {
    this.setState(prevState => ({
      options: {
        ...this.state.options,
        lineNumbers,
      }
    }), this.updateStoredOptions)
    }

  onChangeFontSize = fontSize => {
    this.setState(prevState => ({
      options: {
      ...prevState.options,
      fontSize,
      }
    }), this.updateStoredOptions)
  }

  updateStoredOptions = () => {
    localStorage.setItem(USER_OPTIONS, JSON.stringify(this.state.options));
  }

  onPersistChanged = persistOn => {
    this.setState({ persistOn })
    localStorage.setItem(PERSIST_DATA, String(persistOn))
  }

  render() {

    return (
      <div className="container">
        <PastePanel
          isOpen={this.state.pastePanelVisible}
          persistOn={this.state.persistOn}
          onPersistChanged={this.onPersistChanged}
          onDismiss={() => this.setState({ pastePanelVisible: false })}
        />
        <SettingsPanel
          isOpen={this.state.settingsPanelVisible}
          onDismiss={() => this.setState({ settingsPanelVisible: false })}
          theme={this.state.options.theme}
          onChangeTheme={this.onChangeTheme}
          fontSize={this.state.options.fontSize}
          onChangeFontSize={this.onChangeFontSize}
          lineNumbersOn={this.state.options.lineNumbers}
          onChangeLineNumbersOn={this.onChangeLineNubmersOn}
        />
        <div className="command-bar">
          <CommandBar
            elipisisAriaLabel='More options'
            items={this.getItems()}
            farItems={ this.getOverflowItems() }
          />
        </div>
        <div className="monaco-editor">
          <MonacoEditor
            key={JSON.stringify(this.state.options)}
            editorDidMount={this.editorDidMount}
            width="100%"
            height="100%"
            language={this.state.editorMounted ? this.state.mode : ''}
            value={this.state.content}
            onChange={content => this.setState({ content })}
            options={this.state.options}
            theme={this.state.options.theme}
          />
        </div>
      </div>
    );
  }
}

export default App;
