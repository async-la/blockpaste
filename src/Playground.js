import React, { Component } from 'react'

import BigNumber from 'bignumber.js'
import InfoPanel from './common/InfoPanel'
import PanelGroup from 'react-panelgroup'
import PastePanel from './common/PastePanel'
import ReactModal from 'react-modal'
import MonacoEditor from 'react-monaco-editor'
import SettingsPanel from './common/SettingsPanel'
import Web3 from 'web3'
import _ from 'lodash'
import config from './config'

import { CommandBar } from 'office-ui-fabric-react/lib/CommandBar'
import {
  Dialog,
  DialogType,
  DialogFooter,
} from 'office-ui-fabric-react/lib/Dialog'
import { PrimaryButton, DefaultButton } from 'office-ui-fabric-react/lib/Button'
import { BZZRawGetAsync, BZZRawPostAsync } from './utils/swarm'
import { copyToClipboard } from './utils/copyToClipboard'
import {
  APP_PLAYGROUND,
  USER_OPTIONS_PLAYGROUND,
  PERSIST_DATA_PLAYGROUND,
} from './constants/app'
import {
  decryptPayload,
  encryptPayload,
  generatePasteKey,
  getPasteHash,
} from './utils/pasteHelper'
import './Playground.css'

const defaults = {
  html: {
    label: 'HTML',
    visible: true,
    value: '',
  },
  javascript: {
    label: 'Javascript',
    visible: true,
    value: '',
  },
  css: {
    label: 'CSS',
    visible: true,
    value: '',
  },
}

const codeEditors = ['html', 'javascript', 'css']
const DIVIDER_WIDTH = 1

class Playground extends Component {
  state = {
    css: defaults.css.value,
    html: defaults.html.value,
    infoPanelVisible: false,
    infoSettingsVisible: false,
    javascript: defaults.javascript.value,
    loading: false,
    readOnly: false,
    modalVisible: false,
    options: {
      selectOnLineNumbers: true,
      fontSize: 14,
      automaticLayout: true, // less performant
      lineNumbers: 'on',
      theme: 'vs',
      minimap: {
        enabled: false,
      },
    },
    panels: {
      html: {
        size: 100,
        visible: defaults.html.visible,
      },
      css: {
        size: 100,
        visible: defaults.css.visible,
      },
      javascript: {
        size: 100,
        visible: defaults.javascript.visible,
      },
    },
    panelWidths: [],
    pastePanelVisible: false,
    platform: APP_PLAYGROUND,
    persistOn: true,
  }

  getEditorKey = _.memoize(options => JSON.stringify(options))

  componentWillMount() {
    this.setState({
      persistOn: !(localStorage[PERSIST_DATA_PLAYGROUND] === 'false'),
    })
  }

  componentDidMount() {
    if (localStorage[USER_OPTIONS_PLAYGROUND]) {
      this.setState({
        options: JSON.parse(localStorage[USER_OPTIONS_PLAYGROUND]),
      })
    }

    // Is there an injected web3 instance? Ask if we should use it if so
    if (typeof window.web3 !== 'undefined')
      this.setState({ modalVisible: true })
    else this.createWeb3Instance()

    window.BigNumber = BigNumber

    if (window.location.pathname.split('/')[1]) {
      this.getData(window.location.pathname.split('/')[1])
    }
    this.distributePanelsEvenly()

    const pasteHash = getPasteHash()
    if (pasteHash) this.getData(pasteHash)
  }

  createWeb3Instance = () =>
    (window.web3 = new Web3(
      new Web3.providers.HttpProvider(config.gethAddress)
    ))

  compile = () => {
    this.setState(state => ({ consoleJs: state.javascript }))
    const iframe = this._iframe
    if (!iframe) return
    const code = iframe.contentWindow.document

    code.open()
    code.writeln(this.state.html)

    // Set web3 so it can be used with `console.log()` in javascript snippets
    code.writeln(`<script>window.web3 = window.parent.web3</script>`)
    code.writeln(`<script>window.BigNumber = window.parent.BigNumber</script>`)
    code.writeln(`<style>${this.state.css}</style>`)
    code.writeln(`<script>${this.state.javascript}</script>`)
    code.close()
  }

  updateText(text, type) {
    this.setState({ [type]: text })
  }

  save = async () => {
    const createdAt = Date.now()
    const payload = {
      html: this.state.html,
      css: this.state.css,
      javascript: this.state.javascript,
      createdAt,
      schema: 1,
    }

    if (
      payload.html.trim().length === 0 &&
      payload.css.trim().length === 0 &&
      payload.javascript.trim().length === 0
    )
      return

    // Encrypt JSON Payload
    const key = generatePasteKey()
    const encryptedPayload = encryptPayload(payload, key)
    logger('## encrypted', encryptedPayload.toString())

    try {
      const hash = await BZZRawPostAsync(encryptedPayload)
      if (this.state.persistOn) {
        localStorage.setItem(
          `playground:paste:${createdAt}`,
          JSON.stringify({
            link: `${hash}#${key}`,
            createdAt,
          })
        )
      }
      window.location.replace(`${config.rootAddress}/${hash}#${key}`)
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
      logger('## decrypted', decryptedData)

      // @TODO Check for malformed data
      this.updateText(decryptedData.html || defaults.html.value, 'html')
      this.updateText(decryptedData.css || defaults.css.value, 'css')
      this.updateText(
        decryptedData.javascript || defaults.javascript.value,
        'javascript'
      )

      this.compile()
    } catch (err) {
      alert(
        `There was an error accessing path 'bzz:/${hash}'.\nPlease check console logs.`
      )
      logger('## getData Error: ', err)
    }
  }

  getCommandBarItems() {
    return [
      {
        key: 'title',
        name: 'WEB3 Playground',
        className: 'brand',
        onClick: () => window.location.replace(config.rootAddress),
      },
      {
        key: 'run',
        name: 'Run',
        icon: 'Play',
        onClick: this.compile,
      },
      {
        key: 'save',
        name: 'Save',
        icon: 'Save',
        onClick: this.save,
      },
    ]
  }

  getCommandBarFarItems() {
    return [
      {
        key: 'particles',
        name: 'Particles',
        icon: 'backlog',
        onClick: () => this.setState({ pastePanelVisible: true }),
      },
      {
        key: 'settings',
        icon: 'settings',
        onClick: () => this.setState({ infoSettingsVisible: true }),
      },
      {
        key: 'info',
        icon: 'info',
        onClick: () => this.setState({ infoPanelVisible: true }),
      },
    ]
  }

  distributePanelsEvenly() {
    const panelContainerWidth = document.getElementById('panel-container')
      .offsetWidth
    const visiblePanels = codeEditors.filter(
      panel => this.state.panels[panel].visible
    )
    const panelWidth =
      panelContainerWidth / visiblePanels.length - DIVIDER_WIDTH

    const updatedPanels = visiblePanels
      .map(p => ({
        visible: true,
        size: panelWidth,
      }))
      .reduce((acc, cur, i) => {
        acc[visiblePanels[i]] = cur
        return acc
      }, {})

    const panelWidths = []
    visiblePanels.forEach(panel => {
      panelWidths.push({ size: panelWidth })
    })

    this.setState(state => ({
      panelWidths,
      panels: {
        ...state.panels,
        ...updatedPanels,
      },
    }))
  }

  togglePanel = panel => {
    const panels = codeEditors.reduce((acc, cur) => {
      acc[cur] = {
        size: this.state.panels[cur].size,
        visible:
          panel === cur
            ? !this.state.panels[cur].visible
            : this.state.panels[cur].visible,
      }
      return acc
    }, {})
    this.setState({ panels }, this.distributePanelsEvenly)
  }

  editorDidMount(editor, monaco, language) {
    switch (language) {
      case 'html':
        this._HTMLEditor = editor
        break
      case 'javascript':
        this._JSEditor = editor
        break
      case 'css':
        this._CSSEditor = editor
        break
    }
  }

  copyToClipboard(language) {
    switch (language) {
      case 'html':
        copyToClipboard(this._HTMLEditor.getValue())
        break
      case 'javascript':
        copyToClipboard(this._JSEditor.getValue())
        break
      case 'css':
        copyToClipboard(this._CSSEditor.getValue())
        break
    }
  }

  renderEditor(language) {
    const left = [
      {
        key: 'title',
        name: language ? language.toUpperCase() : '',
        className: 'no-hover brand',
      },
    ]
    const right = [
      {
        key: 'copy',
        icon: 'Copy',
        onClick: () => this.copyToClipboard(language),
      },
    ]
    return (
      <div className="monaco-editor">
        <div className="monaco-editor-header">
          <CommandBar
            elipisisAriaLabel="More options"
            items={left}
            farItems={right}
          />
        </div>
        <MonacoEditor
          key={`${this.getEditorKey(this.state.options)}-${Math.floor(
            this.state.panels[language].size / 50
            // Rerender if changed by over 50px
          )}`}
          editorDidMount={(editor, monaco) =>
            this.editorDidMount(editor, monaco, language)
          }
          value={this.state[language] || ''}
          onChange={text => this.updateText(text, language)}
          options={this.state.options}
          theme={this.state.options.theme}
          height="100%"
          language={language}
          width={this.state.panels[language].size}
        />
      </div>
    )
  }

  renderIFrame() {
    return (
      <div className="iframe-container">
        <iframe
          ref={i => (this._iframe = i)}
          title="Test"
          id="code"
          srcDoc="Result"
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    )
  }

  renderPanels() {
    // NOTE: Seeing some buggy behavior when using { this.state.languageVisible && <Component /> } syntax
    // so I'm explicitly creating the component array instead [dan]
    const panels = []
    codeEditors.forEach(language => {
      if (this.state.panels[language].visible)
        panels.push(this.renderEditor(language))
    })
    return panels
  }

  onUpdatePanel = updatedWidths => {
    const updatedPanels = codeEditors
      .filter(p => this.state.panels[p].visible)
      .reduce((acc, cur, i) => {
        acc[cur] = {
          visible: true,
          size: updatedWidths[i].size,
        }
        return acc
      }, {})
    this.setState(state => ({
      panelWidths: updatedWidths.map(w => ({ size: w.size })),
      panels: { ...state.panels, ...updatedPanels },
    }))
  }

  updateStoredOptions = () => {
    localStorage.setItem(
      USER_OPTIONS_PLAYGROUND,
      JSON.stringify(this.state.options)
    )
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

  onChangeLineNumbersOn = lineNumbers => {
    this.setState(
      prevState => ({
        options: {
          ...prevState.options,
          lineNumbers,
        },
      }),
      this.updateStoredOptions
    )
  }

  onPersistChanged = persistOn => {
    this.setState({ persistOn })
    localStorage.setItem(PERSIST_DATA_PLAYGROUND, String(persistOn))
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
        <InfoPanel
          isOpen={this.state.infoPanelVisible}
          onDismiss={() => this.setState({ infoPanelVisible: false })}
        />
        <SettingsPanel
          isOpen={this.state.infoSettingsVisible}
          onDismiss={() => this.setState({ infoSettingsVisible: false })}
          theme={this.state.options.theme}
          onChangeTheme={this.onChangeTheme}
          fontSize={this.state.options.fontSize}
          onChangeFontSize={this.onChangeFontSize}
          lineNumbersOn={this.state.options.lineNumbers}
          onChangeLineNumbersOn={this.onChangeLineNumbersOn}
        />
        <div className="command-bar">
          <CommandBar
            elipisisAriaLabel="More options"
            items={this.getCommandBarItems()}
            farItems={this.getCommandBarFarItems()}
          />
        </div>
        <div id="panel-container" className="panel-container">
          <PanelGroup
            borderColor="#DDD"
            spacing={1}
            panelWidths={this.state.panelWidths}
            onUpdate={this.onUpdatePanel}
          >
            {this.renderPanels()}
          </PanelGroup>
        </div>
        {this.renderIFrame()}

        <Dialog
          hidden={!this.state.modalVisible}
          onDismiss={() => {
            this.createWeb3Instance()
            this.setState({ modalVisible: false })
          }}
          dialogContentProps={{
            type: DialogType.normal,
            title: 'Hi there',
            subText:
              'Looks like you already have an injected instance of web3. Do you want to use it?',
          }}
          modalProps={{
            isBlocking: false,
            containerClassName: 'ms-dialogMainOverride',
          }}
        >
          <DialogFooter>
            <PrimaryButton
              text="Yes"
              onClick={() => {
                // Using current window.web3, noop
                this.setState({ modalVisible: false })
              }}
            />
            <DefaultButton
              onClick={() => {
                this.createWeb3Instance()
                this.setState({ modalVisible: false })
              }}
              text="No"
            />
          </DialogFooter>
        </Dialog>
      </div>
    )
  }
}

export default Playground
