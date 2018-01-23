import React, { Component } from 'react'
import InfoPanel from './common/InfoPanel'
import MonacoEditor from 'react-monaco-editor'
import PastePanel from './pastebin/PastePanel'
import SettingsPanel from './common/SettingsPanel'
import { rootAddress } from './constants/api'

import { CommandBar } from 'office-ui-fabric-react/lib/CommandBar'
import { Dropdown } from 'office-ui-fabric-react/lib/Dropdown'
import {
  decryptPayload,
  encryptPayload,
  getPasteHash,
  generatePasteKey,
} from './utils/pasteHelper'
import { BZZRawGetAsync, BZZRawPostAsync } from './utils/swarm'
import { copyToClipboard } from './utils/copyToClipboard'
import _ from 'lodash'

import './BlockPaste.css'
import './Playground.css'

const VERSION = 1

const PERSIST_DATA = 'blockpaste:persistData'
const USER_OPTIONS = 'blockpaste:userOptions'

class Blockpaste extends Component {
  state = {
    content: '',
    description: '',
    editorMounted: false,
    filename: '',
    languages: [],
    infoPanelVisible: false,
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
    },
  }

  componentWillMount() {
    if (localStorage[USER_OPTIONS]) {
      this.setState({
        options: JSON.parse(localStorage[USER_OPTIONS]),
      })
    }
    this.setState({
      persistOn: !(localStorage[PERSIST_DATA] === 'false'),
    })
  }

  componentDidMount() {
    const pasteHash = getPasteHash()
    if (pasteHash) this.getData(pasteHash)
  }

  getOverflowItems() {
    return [
      {
        key: 'pastes',
        name: 'Pastes',
        icon: 'Paste',
        onClick: () => this.setState({ pastePanelVisible: true }),
      },
      {
        key: 'settings',
        icon: 'Settings',
        onClick: () => this.setState({ settingsPanelVisible: true }),
      },
      {
        key: 'info',
        icon: 'info',
        onClick: () => this.setState({ infoPanelVisible: true }),
      },
    ]
  }

  getItems() {
    return [
      {
        key: 'title',
        name: 'BLOCKPASTE',
        className: 'brand',
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
              style={{ marginTop: 4, width: '200px', textAlign: 'center' }}
              options={this.getSelectBoxOptions()}
              selectedKey={this.state.mode}
              onChanged={this.handleLanguageChange}
            />
          </div>
        ),
      },
      this.state.content && {
        key: 'copy',
        name: 'Copy to Clipboard',
        icon: 'Copy',
        onClick: () => copyToClipboard(this._editor.getValue()),
      },
    ]
  }

  save = async () => {
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
    const encryptedPayload = encryptPayload(payload, key)
    logger('## encrypted', encryptedPayload.toString())

    try {
      const hash = await BZZRawPostAsync(encryptedPayload)
      if (this.state.persistOn) {
        localStorage.setItem(
          `blockpaste:paste:${createdAt}`,
          JSON.stringify({
            link: `${hash}#${key}`,
            createdAt,
          })
        )
      }
      window.location.replace(`${rootAddress}/${hash}#${key}`)
    } catch (err) {
      alert(
        `There was an error saving your snippet'.\nPlease check console logs.`
      )
      logger('## save error: ', err)
    }
  }

  getData = async hash => {
    try {
      const payload = await BZZRawGetAsync(hash)
      const decryptedData = decryptPayload(payload)

      const { content, description, filename, mode } = decryptedData
      this.setState({ content, description, filename, mode })
    } catch (err) {
      alert(
        `There was an error accessing path 'bzz:/${hash}'.\nPlease check console logs.`
      )
    }
  }

  handleInputChange = event => {
    const { name, value } = event.target
    this.setState({ [name]: value })
  }

  handleLanguageChange = event => {
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
    this.setState(
      prevState => ({
        options: {
          ...prevState.options,
          theme,
        },
      }),
      this.updateStoredOptions
    )
  }

  onChangeLineNubmersOn = lineNumbers => {
    this.setState(
      prevState => ({
        options: {
          ...this.state.options,
          lineNumbers,
        },
      }),
      this.updateStoredOptions
    )
  }

  onChangeFontSize = fontSize => {
    this.setState(
      prevState => ({
        options: {
          ...prevState.options,
          fontSize,
        },
      }),
      this.updateStoredOptions
    )
  }

  updateStoredOptions = () => {
    localStorage.setItem(USER_OPTIONS, JSON.stringify(this.state.options))
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
        <InfoPanel
          isOpen={this.state.infoPanelVisible}
          onDismiss={() => this.setState({ infoPanelVisible: false })}
        />
        <div className="command-bar">
          <CommandBar
            elipisisAriaLabel="More options"
            items={this.getItems()}
            farItems={this.getOverflowItems()}
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
    )
  }
}

export default Blockpaste
