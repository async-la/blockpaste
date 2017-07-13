import React, { Component } from 'react';

import CryptoJS from 'crypto-js'
import Codemirror from 'react-codemirror'
import Web3 from 'web3'

import './App.css';
import 'codemirror/lib/codemirror.css'
import 'codemirror/mode/javascript/javascript'
import 'codemirror/mode/css/css'
import 'codemirror/mode/htmlmixed/htmlmixed'

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

    if (window.location.pathname.split( '/' )[1]) {
      this.getData(window.location.pathname.split( '/' )[1])
    }
  }

  compile = () => {
    const iframe = document.getElementById('code')
    const code = iframe.contentWindow.document;

    code.open();
    code.writeln(this._htmlTextArea.textareaNode.innerText)

    // Set web3 so it can be used with `console.log()` in js snippets
    code.writeln(`<script>window.web3 = window.parent.web3</script>`);
    code.writeln(`<style>${this._cssTextArea.textareaNode.innerText}</style>`)
    code.writeln(`<script>${this._jsTextArea.textareaNode.innerText}</script>`);
    code.close();
  }

  updateText(text, type) {
    switch (type) {
      case 'html':
        this.setState({ html: text })
        break
      case 'css':
        this.setState({ css: text })
        break
      case 'js':
        this.setState({ js: text })
        break
      default:
        break
    }
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

  downloadInnerHtml() {
    const elHtml = document.getElementById("code").innerHTML;
    const link = document.createElement('a');

    link.setAttribute('download', 'particle.html');
    link.setAttribute('href', 'data:' + 'text/html' + ';charset=utf-8,' + encodeURIComponent(elHtml));
    link.click();
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

  render() {
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

        <div className="app-content">
          <div className="app-sidebar">
            <a href="/6979bf11efedf6b8d40912ee8679bec79f4610fe565bd418a2ac1bed5ebc555f">Readme</a>
            <a href="/6c1e9314d927c35eb0759aed24e95695cd5fa2d4d4116620a1fb3b252e8cc79e">Examples</a>
          </div>


          <div className="app-main">
            <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'space-between'}}>
              <Codemirror ref={ref => this._htmlTextArea = ref} value={this.state.html || ''} onChange={(text) => this.updateText(text, 'html')} options={{lineNumbers: true, mode: 'htmlmixed', lineWrapping: true }} />
              <Codemirror ref={ref => this._cssTextArea = ref} value={this.state.css || ''} onChange={(text) => this.updateText(text, 'css')} options={{lineNumbers: true, mode: 'css', lineWrapping: true }} />
            </div>

            <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'space-between'}}>
              <Codemirror ref={ref => this._jsTextArea = ref}  value={this.state.js || ''} onChange={(text) => this.updateText(text, 'js')} options={{lineNumbers: true, mode: 'javascript', lineWrapping: true }} />
              <iframe title="Test" id="code" srcDoc="Output"></iframe>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
