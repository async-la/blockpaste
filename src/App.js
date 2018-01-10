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
  html: '<!-- HTML -->',
  js: '// JS',
  css : '/* CSS */',
}

const key = 'hR&$yc=oJHXRN?Yo/^fqPtShjnXPF4ehd1?!O}6t#{jnzq7MsWlDX,,bfh_bvX_'

class App extends Component {
  state = {
    loading: false,
    readOnly: false,
    html: defaults.html,
    css: defaults.css,
    js: defaults.js,
    htmlVisible: true,
    cssVisible: true,
    jsVisible: true,
    consoleVisible: true,
    outputVisible: true,
    consoleJs: '',
  }

  componentDidMount() {
    let web3 = new Web3(new Web3.providers.HttpProvider(gethAddress));

    // Set web3 as global so it can be access via debugger
    window.web3 = web3
    window.BigNumber = BigNumber

    if (window.location.pathname.split( '/' )[1]) {
      this.getData(window.location.pathname.split( '/' )[1])
    }
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
        this.updateText(decryptedData.html ||  defaults.html, 'html')
        this.updateText(decryptedData.css || defaults.css, 'css')
        this.updateText(decryptedData.js || defaults.js, 'js')

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

  getItems() {
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

  getFarItems() {
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

  getEditorTabs() {
    return [
      {
        key: 'html',
        name: 'HTML'
      },
      {
        key: 'css',
        name: 'CSS'
      },
      {
        key: 'js',
        name: 'JS'
      },
      {
        key: 'output',
        name: 'Output'
      },
      {
        key: 'console',
        name: 'Console'
      },
    ]
  }

  getEditorButtons = () => {
    return this.getEditorTabs().map(tab => (
      <DefaultButton
        key={tab.key}
        text={tab.name}
        checked={this.state[`${tab.key}Visible`]}
        onClick={() => this.setState(state => ({ [`${tab.key}Visible`]: !state[`${tab.key}Visible`]}))}
      />
    ))
  }


  render() {

    const options =  {
          selectOnLineNumbers: true,
          fontSize: 14,
          automaticLayout: true, // less performant
          lineNumbers: 'on',
          theme: 'vs',
        }

    const { htmlVisible, cssVisible, jsVisible } = this.state
    const atLeastOneEditorVisible = htmlVisible || cssVisible || jsVisible

    return (
      <div className="App">

        <div className="command-bar">
          <CommandBar
            elipisisAriaLabel='More options'
            items={this.getItems()}
            farItems={this.getFarItems()}
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
            <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', padding: 5, backgroundColor: '#eaeaea'}}>
              { this.getEditorButtons() }
            </div>
          </div>

                <PanelGroup
                  key={`key-${this.state.htmlVisible}${this.state.cssVisible}${this.state.jsVisible}${this.state.outputVisible}${this.state.consoleVisible}`}

                  borderColor="#ccc"
                  spacing={1}
                >

              {this.state.htmlVisible && <MonacoEditor
                value={this.state.html || ''}
                onChange={(text) => this.updateText(text, 'html')}
                options={options}
                theme="vs"
                language="html"
              />}
              {this.state.cssVisible &&
                <MonacoEditor
                  value={this.state.css || ''}
                  onChange={(text) => this.updateText(text, 'css')}
                  options={options}
                  theme="vs"
                  langauge="css"
                />}
              {this.state.jsVisible &&
                <MonacoEditor
                  value={this.state.js || ''}
                  onChange={(text) => this.updateText(text, 'js')}
                  options={options}
                  theme="vs"
                  language="javascript"
                />
              }
              {this.state.outputVisible &&
                <div
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
            }
              {this.state.consoleVisible &&
                <div style={{padding: 10}}>
                <Consoled
                  consoleLog={(row, i) => <div style={{padding: 10}}><span key={i} className="console-log">{row}</span></div> }
                >{this.state.consoleJs}</Consoled>
              </div>
               }
              </PanelGroup>

          </div>
        </div>
      </div>
    );
  }
}

export default App;
