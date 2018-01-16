import React, { Component } from 'react';
import CryptoJS from 'crypto-js'
import MonacoEditor from 'react-monaco-editor';
import { gethAddress, swarmAddress, rootAddress } from './constants/api'

import { CommandBar } from 'office-ui-fabric-react/lib/CommandBar';
import { Dropdown, IDropdown, DropdownMenuItemType, IDropdownOption } from 'office-ui-fabric-react/lib/Dropdown';
import { Panel, PanelType } from 'office-ui-fabric-react/lib/Panel';
import { TextField } from 'office-ui-fabric-react/lib/TextField';

import { initializeIcons } from '@uifabric/icons';

// Register icons and pull the fonts from the default SharePoint cdn.
initializeIcons();

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
    const pasteHash = this.getPasteHash()
    if (this.getPasteHash()) this.getData(pasteHash)
  }

  getPastes = () => {
    let pastes = [];
    for (let key in localStorage) {
      if (key.indexOf('blockpaste') !== -1) {
        const link = localStorage.getItem(key)
        const date = key.split(':')[2]
        pastes.push(
          <div key={key}>
            <a href={link}>{new Date(parseInt(date)).toString()}</a>
            <button onClick={() => this.deletePaste(key)}>Delete</button>
          </div>
        )
      }
    }
    return pastes
  }

  getOverflowItems() {
      return [
      {
        key: 'languages',
        name: 'Syntax',
        onRender: () => (
          <div>
          <Dropdown
            style={{marginTop: 4}}
            className='Dropdown-example'
            placeHolder='Syntax Highlighting'
            id='Basicdrop1'
            defaultSelectedKeys={['sol']}
            options={this.getSelectBoxOptions()}
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


  deletePaste(key) {
    localStorage.removeItem(key)
    this.forceUpdate()
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

    const key = this.generatePasteKey()
    const encryptedPayload = CryptoJS.AES.encrypt(JSON.stringify(payload), key);
    logger('## encrypted', encryptedPayload.toString())

    const req = new XMLHttpRequest();
    req.open('POST', `${swarmAddress}/bzz:`);
    req.onload = function(event) {
      if (req.status === 200) {
        localStorage.setItem(`blockpaste:V${VERSION}:${createdAt}`, `${req.responseText}#${key}`);
        window.location.replace(`${rootAddress}/${req.responseText}#${key}`)
      } else {
        alert(`There was an error saving your snippet'.\nPlease check console logs.`)
      }
    }
    req.send(encryptedPayload);
  }

  getData = (hash) => {

    const req = new XMLHttpRequest();
    req.open('GET', `${swarmAddress}/bzz:/${hash}`);
    req.onload = (event) => {
      if (req.status === 200) {
        const bytes = CryptoJS.AES.decrypt(req.responseText, this.getPasteKey());
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
    const { value } = event.target
    this.setState({ mode: value })
  }


  editorDidMount = (editor, monaco) => {
    const languages = monaco.languages.getLanguages()
    this.setState({ languages, editorMounted: true })
  }

  renderLanguageSelection() {
      return (
        <select value={this.state.mode} onChange={this.handleLanguageChange}>
          {
            this.state.languages.map(lang => {
              const alias = lang.aliases[0] === 'sol' ? 'Solidity' : lang.aliases[0]
              return <option key={lang.id} value={lang.id}>{alias}</option>
            })
          }
        </select>
      )
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
         theme: 'vs-dark',
         fontSize: 16,
         automaticLayout: true
       };
    return (
      <div className="container">
        <Panel
          isOpen={this.state.pastePanelVisible}
          type={ PanelType.smallFixedFar }
          onDismiss={() => this.setState({ pastePanelVisible: false })}
          headerText='Panel - Small, right-aligned, fixed, with footer'
          closeButtonAriaLabel='Close'
          >{this.getPastes()}
        </Panel>
        <CommandBar
          elipisisAriaLabel='More options'
          items={this.getItems()}
          farItems={ this.getOverflowItems() }
        />
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
