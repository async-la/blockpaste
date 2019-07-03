import React, { Component } from 'react'
import InfoPanel from './common/InfoPanel'
import MonacoEditor from 'react-monaco-editor'
import PastePanel from './common/PastePanel'
import SettingsPanel from './common/SettingsPanel'
import config from './config'

import { CommandBar } from 'office-ui-fabric-react/lib/CommandBar'
import { Dropdown } from 'office-ui-fabric-react/lib/Dropdown'
import {
  decryptPayload,
  encryptPayload,
  getPasteHash,
  generatePasteKey,
  getPasteKey,
} from './utils/pasteHelper'
import { BZZRawGetAsync, BZZRawPostAsync } from './utils/swarm'
// import { copyToClipboard } from './utils/copyToClipboard'
import {
  APP_SWARM_BIN,
  PASTE_SWARM_BIN,
  USER_OPTIONS_SWARM_BIN,
  PERSIST_DATA_SWARM_BIN,
} from './constants/app'
import _ from 'lodash'

import './SwarmBin.css'
import './Playground.css'

const VERSION = 1

class SwarmBin extends Component {
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
    platform: APP_SWARM_BIN,
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
    if (localStorage[USER_OPTIONS_SWARM_BIN]) {
      this.setState({
        options: JSON.parse(localStorage[USER_OPTIONS_SWARM_BIN]),
      })
    }
    this.setState({
      persistOn: !(localStorage[PERSIST_DATA_SWARM_BIN] === 'false'),
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
        name: 'SwarmBin',
        className: 'brand',
        onClick: () => window.location.replace(config.rootAddress),
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
          <Dropdown
            // @NOTE: Only inline style works here. Unclear as to why. [cdro]
            style={{
              marginTop: 4,
              width: '200px',
              textAlign: 'center',
              fontFamily:
                '"Segoe UI Web (West European)", "Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
            }}
            options={this.getSelectBoxOptions()}
            selectedKey={this.state.mode}
            onChanged={this.handleLanguageChange}
          />
        ),
      },
      // this.state.content && {
      //   key: 'copy',
      //   name: 'Copy to Clipboard',
      //   icon: 'Copy',
      //   onClick: () => copyToClipboard(this._editor.getValue()),
      // },
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
          `${PASTE_SWARM_BIN}:${createdAt}`,
          JSON.stringify({
            link: `${hash}#${key}`,
            createdAt,
          })
        )
      }
      window.history.replaceState(
        null,
        null,
        `${config.rootAddress}/${hash}#${key}`
      )
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
      const body = await payload.text()
      const decryptedData = decryptPayload(body)

      const { content, description, filename, mode } = decryptedData
      this.setState({ content, description, filename, mode })
    } catch (err) {
      console.log(err)
      alert(
        `There was an error accessing path 'bzz:/${hash}'.\nPlease check console logs.`
      )
      logger('## get data: ', err)
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
    localStorage.setItem(
      USER_OPTIONS_SWARM_BIN,
      JSON.stringify(this.state.options)
    )
  }

  onPersistChanged = persistOn => {
    this.setState({ persistOn })
    localStorage.setItem(PERSIST_DATA_SWARM_BIN, String(persistOn))
  }

  render() {
    return (
      <div className="container">
        <PastePanel
          isOpen={this.state.pastePanelVisible}
          persistOn={this.state.persistOn}
          onPersistChanged={this.onPersistChanged}
          onDismiss={() => this.setState({ pastePanelVisible: false })}
          platform={this.state.platform}
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

export default SwarmBin