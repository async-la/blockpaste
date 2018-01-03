import React, { Component } from 'react';
import CryptoJS from 'crypto-js'
import MonacoEditor from 'react-monaco-editor';
import PastePanel from './pastebin/PastePanel';
import { gethAddress, swarmAddress, rootAddress } from './constants/api'

import { CommandBar } from 'office-ui-fabric-react/lib/CommandBar';
import { Dropdown, IDropdown, DropdownMenuItemType, IDropdownOption } from 'office-ui-fabric-react/lib/Dropdown';
import { Panel, PanelType } from 'office-ui-fabric-react/lib/Panel';
import { TextField } from 'office-ui-fabric-react/lib/TextField';

import { getPasteHash, getPasteKey, generatePasteKey } from './utils/pasteHelper'
import _ from 'lodash'

import './PasteBin.css';

const VERSION = 1

class App extends Component {
  state = {
    content: '',
    description: '',
    editorMounted: false,
    filename: '',
    languages: [],
    mode: 'plaintext',
    pastePanelVisible: false,
    settingsPanelVisible: false,
  }

  componentDidMount() {
    const pasteHash = getPasteHash()
    if (getPasteHash()) this.getData(pasteHash)
  }

  getOverflowItems() {
      return [
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
        onClick: () => alert('Coming soon'),
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
        key: 'filename',
        name: 'Filename',
        onRender: () => {
          <TextField
            placeholder='I am a placeholder.'
            ariaLabel='Please enter text here'
          />
        }

      },
      {
        key: 'description',
        name: 'Description',
        onRender: () => {
          <TextField
            placeholder='I am a placeholder.'
            ariaLabel='Please enter text here'
          />
        }

      },
    ]
  }

  showPastes = () => {
    this.setState({ pastePanelVisible: true })
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
    req.open('POST', `${swarmAddress}/bzzr:`);
    req.onload = function(event) {
      if (req.status === 200) {
        localStorage.setItem(`blockpaste:${createdAt}`, JSON.stringify({
          link: `${req.responseText}#${key}`,
          createdAt,
        }));
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
    this.setState({ languages, editorMounted: true })
    editor.focus()
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

  render() {
    const options = {
      selectOnLineNumbers: true,
      fontSize: 14,
      automaticLayout: true // less performant
    };
    return (
      <div className="container">
        <PastePanel
          isOpen={this.state.pastePanelVisible}
          onDismiss={() => this.setState({ pastePanelVisible: false })}
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
            editorDidMount={this.editorDidMount}
            width="100%"
            height="100%"
            language={this.state.editorMounted ? this.state.mode : ''}
            value={this.state.content}
            onChange={content => this.setState({ content })}
            options={options}
          />
        </div>
      </div>
    );
  }
}

export default App;
