import React, { Component } from 'react';

import BigNumber from 'bignumber.js'
import CryptoJS from 'crypto-js'

import { CommandBar } from 'office-ui-fabric-react/lib/CommandBar';
import { Dropdown, IDropdown, DropdownMenuItemType, IDropdownOption } from 'office-ui-fabric-react/lib/Dropdown';
import { Nav, INavProps } from 'office-ui-fabric-react/lib/Nav';


import MonacoEditor from 'react-monaco-editor';

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
    const iframe = document.getElementById('code')
    const code = iframe.contentWindow.document;
    console.log('NTML', this.state.html)

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

  htmlEditorDidMount = (editor, monaco) => {
    console.log('EDITOR',editor)
    console.log('MONCAO', monaco)
    console.log(monaco.languages.getLanguages())
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
          icon: 'Play'
        },
    ]
  }

  getFarItems() {
    return [
      {
        key: 'save',
        name: 'Save',
        icon: 'Save',
        onClick: this.save,
      },
      {
        key: 'new',
        name: 'New',
        icon: 'CircleAddition',
        onClick: () => window.location.replace(rootAddress),
      },
    ]
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
        <div className="app-header">
          <div className="app-header-left">
            <span>ETH Sandbox</span>
            <button onClick={this.compile} id="button">Run</button>
          </div>
          <div className="app-header-right">
            <button onClick={this.convert} id="button">Save</button>
            <button onClick={() => window.location.replace(rootAddress)} id="button">New</button>
          </div>
        </div>

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
            <div className="editor-container" style={{display: 'flex', flexDirection: 'row', justifyContent: 'space-between', flex: 1 }}>
              <MonacoEditor
                ref={ref => this._htmlTextArea = ref}
                value={this.state.html || ''}
                onChange={(text) => this.updateText(text, 'html')}
                options={options}
                theme="vs"
                editorDidMount={this.htmlEditorDidMount}
                language="html"
              />
              <MonacoEditor
                ref={ref => this._cssTextArea = ref}
                value={this.state.css || ''}
                onChange={(text) => this.updateText(text, 'css')}
                options={options}
                theme="vs"
                langauge="css"
              />
              <MonacoEditor
                ref={ref => this._jsTextArea = ref}
                value={this.state.js || ''}
                onChange={(text) => this.updateText(text, 'js')}
                options={options}
                theme="vs"
                language="javascript"
              />
            </div>

            <div style={{ flex: 1 }}>
              <iframe title="Test" id="code" srcDoc="Output"></iframe>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
