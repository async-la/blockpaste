import React, { Component } from 'react';

import BigNumber from 'bignumber.js'
import CryptoJS from 'crypto-js'

import { CommandBar } from 'office-ui-fabric-react/lib/CommandBar';
import { Dropdown, IDropdown, DropdownMenuItemType, IDropdownOption } from 'office-ui-fabric-react/lib/Dropdown';
import { Nav, INavProps } from 'office-ui-fabric-react/lib/Nav';
import { DefaultButton, IButtonProps } from 'office-ui-fabric-react/lib/Button';
import { Label } from 'office-ui-fabric-react/lib/Label';

import PanelGroup from 'react-panelgroup'
import MonacoEditor from 'react-monaco-editor';
import Consoled from 'react-consoled';

import Web3 from 'web3'

import './App.css';

import { gethAddress, swarmAddress, rootAddress } from './constants/api'

const defaults = {
  html: {
    label: 'HTML',
    value: '<!-- HTML -->',
    visible: true,
  },
  css: {
    label: 'CSS',
    value: '/* CSS */',
    visible: false,
  },
  js: {
    label: 'JS',
    value: '// JS',
    visible: true,
  },
  console: {
    label: 'Console',
    value: '[ console ]',
    visible: true,
  },
  output: {
    label: 'Output',
    visible: false,
  },
}

const codeEditors = ['html', 'css', 'js']
const panelOrder = ['html', 'css', 'js', 'console', 'output']

const DIVIDER_WIDTH = 1

const key = 'hR&$yc=oJHXRN?Yo/^fqPtShjnXPF4ehd1?!O}6t#{jnzq7MsWlDX,,bfh_bvX_'

class App extends Component {
  state = {
    consoleJs: 'console.log("[ console ]")',
    css: defaults.css.value,
    html: defaults.html.value,
    js: defaults.js.value,
    loading: false,
    readOnly: false,
    panels: {
      html: {
        size: 100,
        visible: defaults.html.visible,
      },
      css: {
        size: 100,
        visible: defaults.css.visible,
      },
      js: {
        size: 100,
        visible: defaults.js.visible,
      },
      console: {
        size: 100,
        visible: defaults.console.visible,
      },
      output: {
        size: 100,
        visible: defaults.output.visible,
      },
    },
    panelWidths: [],
  }

  componentDidMount() {
    let web3 = new Web3(new Web3.providers.HttpProvider(gethAddress));

    // Set web3 as global so it can be access via debugger
    window.web3 = web3
    window.BigNumber = BigNumber

    if (window.location.pathname.split( '/' )[1]) {
      this.getData(window.location.pathname.split( '/' )[1])
    }
    this.distributePanelsEvenly()
  }

  compile = () => {
    this.setState(state => ({ consoleJs: state.js }))
    const iframe = this._iframe
    if (!iframe) return
    const code = iframe.contentWindow.document;

    code.open();
    code.writeln(this.state.html)

    // Set web3 so it can be used with `console.log()` in js snippets
    code.writeln(`<script>window.web3 = window.parent.web3</script>`);
    code.writeln(`<script>window.BigNumber = window.parent.BigNumber</script>`);
    code.writeln(`<style>${this.state.css}</style>`)
    code.writeln(`<script>${this.state.js}</script>`);
    code.close();
  }

  updateText(text, type) {
    this.setState({ [type]: text })
  }

  convert = () => {
    const payload = {
      html: this.state.html,
      css: this.state.css,
      js: this.state.js,
      createdAt: Date.now(),
      schema: 1,
    }

    // Encrypt JSON Payload
    const ciphertext = CryptoJS.AES.encrypt(JSON.stringify(payload), key);
    logger('## encrypted', ciphertext.toString())

    this.uploadToSwarm(ciphertext.toString())
  }

  getData = (hash) => {
    this.setState({ loading: true })

    let req = new XMLHttpRequest();

    req.open('GET', `${swarmAddress}/bzz:/${hash}`);

    req.onload = (event) => {
      if (req.status === 200) {
        const bytes = CryptoJS.AES.decrypt(req.responseText, key);
        const decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));

        logger('## decrypted', decryptedData)
        this.updateText(decryptedData.html ||  defaults.html.value, 'html')
        this.updateText(decryptedData.css || defaults.css.value, 'css')
        this.updateText(decryptedData.js || defaults.js.value, 'js')

        this.compile()
      } else {
        alert(`There was an error accessing path 'bzz:/${hash}'.\nPlease check console logs.`)
      }

      this.setState({ loading: false })
    }
    req.send(null);
  }

  uploadToSwarm(content) {
    let req = new XMLHttpRequest();

    req.open('POST', `${swarmAddress}/bzz:/`);

    req.onload = function(event) {
      if (req.status === 200) {
        // success
        window.history.pushState(null, null, `${rootAddress}/${req.responseText}`)
      } else {
        alert(`There was an error saving your snippet'.\nPlease check console logs.`)
      }
    }
    req.send(content);
  }

  getCommandBarItems() {
      return [
        {
          key: 'title',
          name: 'ETH Sandbox'
        },
        {
          key: 'run',
          name: 'Run',
          icon: 'Play',
          onClick: this.compile,
        },
    ]
  }

  getCommandBarFarItems() {
    return [
      {
        key: 'save',
        name: 'Save',
        icon: 'Save',
        onClick: this.convert,
      },
      {
        key: 'new',
        name: 'New',
        icon: 'CircleAddition',
        onClick: () => window.location.replace(rootAddress),
      },
    ]
  }

  generateButtonColor(color) {
    return {
      backgroundColor: color,
      color: 'white',
    }
  }

  generateButtonStyle(rootColor, rootCheckedColor, rootHoverColor, rootCheckedHoverColor) {
    return {
        root: this.generateButtonColor(rootColor),
        rootChecked: this.generateButtonColor(rootCheckedColor),
        rootHovered: this.generateButtonColor(rootHoverColor),
        rootCheckedHovered: this.generateButtonColor(rootCheckedHoverColor),
    }
  }

  getButtonStyle(key) {
    const styles = {
      html: this.generateButtonStyle('#ccc', '#ff8c00'),
      css: this.generateButtonStyle('#ccc', '#0078d7'),
      js: this.generateButtonStyle('#ccc', '#ffb900'),
      output: this.generateButtonStyle('#ccc', '#333333'),
      console: this.generateButtonStyle('#ccc', '#666666'),
    }
    return styles[key]
  }

  distributePanelsEvenly() {
    const panelContainerWidth = document.getElementById('panel-container').offsetWidth
    const visiblePanels = panelOrder.filter(panel => this.state.panels[panel].visible)
    const panelWidth = panelContainerWidth / visiblePanels.length - DIVIDER_WIDTH

    const updatedPanels = visiblePanels.map(p => ({
      visible: true,
      size: panelWidth,
    })).reduce((acc, cur, i) => {
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
      }
    }))
  }

  getEditorButtons = () => {
    return panelOrder.map(panel => (
      <DefaultButton
        key={panel}
        text={defaults[panel].label}
        checked={this.state.panels[panel].visible}
        onClick={() => this.togglePanel(panel)}
        styles={this.getButtonStyle(panel)}
      />
    ))
  }

  togglePanel = panel => {
    const panels = panelOrder.reduce((acc, cur) => {
      acc[cur] = {
        size: this.state.panels[cur].size,
        visible: panel === cur ? !this.state.panels[cur].visible : this.state.panels[cur].visible
      }
      return acc
    }, {})
    this.setState({ panels }, this.distributePanelsEvenly)
  }

  renderEditor(language, options) {
    return (
      <MonacoEditor
        key={`key-${language}-${Math.floor(this.state.panels[language].size / 50)}`} // Rerender if changed by over 50px
        value={this.state[language] || ''}
        onChange={(text) => this.updateText(text, language)}
        options={options}
        theme="vs"
        language={language}
        width={this.state.panels[language].size}
      />
    )
  }

  renderIFrame() {
    return (
      <div
        key={'key-iframe'}
        id="iframe-wrapper"
        style={{ flex: 1, paddingLeft: 20, paddingRight: 20 }}
      >
        <iframe
          ref={i => this._iframe = i}
          title="Test"
          id="code"
          srcDoc="Output"
          style={{ width: '100%', height: '100%' }}
          >
        </iframe>
    </div>
    )
  }

  renderConsole() {
    return (
      <div style={{ flex: 1 }} key={'key-console'}>
        <Consoled
          consoleLog={(row, i) => <div key={i} style={{padding: 10}}><span className="console-log">{row}</span></div> }
        >
          {this.state.consoleJs}
        </Consoled>
      </div>
    )
  }

  renderPanels(options) {
    // NOTE: Seeing some buggy behavior when using { this.state.languageVisible && <Component /> } syntax
    // so I'm explicitly creating the component array instead [dan]
    const panels = []
    codeEditors.forEach(language => {
      if (this.state.panels[language].visible) panels.push(this.renderEditor(language, options))
    })
    if (this.state.panels['console'].visible) panels.push(this.renderConsole())
    if (this.state.panels['output'].visible) panels.push(this.renderIFrame())
    return panels
  }

  onUpdatePanel = updatedWidths => {
    const updatedPanels = panelOrder.filter(p => this.state.panels[p].visible).reduce((acc, cur, i) => {
      acc[cur] = {
        visible: true,
        size: updatedWidths[i].size
      }
      return acc
    }, {})
    this.setState( state => ({ panelWidths: updatedWidths.map(w => ({ size: w.size })), panels: { ...state.panels, ...updatedPanels } }))
  }


  render() {
    const options =  {
          selectOnLineNumbers: true,
          fontSize: 14,
          automaticLayout: true, // less performant
          lineNumbers: 'on',
          theme: 'vs',
        }

    return (
      <div className="App">

        <div className="command-bar">
          <CommandBar
            elipisisAriaLabel='More options'
            items={this.getCommandBarItems()}
            farItems={this.getCommandBarFarItems()}
          />
        </div>

        <div className="app-content">
          <div className="app-sidebar">
            <Nav
          groups={
            [
              {
                links:
                [
                  { name: 'Playground', url: '/', key: 'key1', onClick: () => this.setState({ selectedKey: 'key1' }) },
                  { name: 'Readme', url: '/b3ecdff9f883d3e98013bebfa364c2a01e62785396464e9e5a8b9cce656dc661', key: 'key2', onClick: () => this.setState({ selectedKey: 'key2' })},
                  { name: 'Examples', url: '/0e84c4ed8f22fbb859f4ec4580a1fa731a881940f42e6af1c871a58a746556c3', key: 'key3', onClick: () => this.setState({ selectedKey: 'key3' }) },

                ]
              }
            ]
          }
          expandedStateText={ 'expanded' }
          collapsedStateText={ 'collapsed' }
          selectedKey={ this.state.selectedKey }
        />
          </div>
            <div className="app-main">
              <div style={{ marginBottom: 5}}>
              <div style={{ display: 'flex', flexDirection: 'row', padding: 5, backgroundColor: '#eaeaea'}}>
                {this.getEditorButtons()}
              </div>
            </div>
            <div id="panel-container" style={{ flex: 1 }}>
              <PanelGroup
                borderColor="#DDD"
                spacing={1}
                panelWidths={this.state.panelWidths}
                onUpdate={this.onUpdatePanel}
              >
                {this.renderPanels()}
              </PanelGroup>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
