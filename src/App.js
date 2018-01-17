import React, { Component } from "react";

import BigNumber from "bignumber.js";
import PanelGroup from "react-panelgroup";
import MonacoEditor from "react-monaco-editor";
import Web3 from "web3";

import { CommandBar } from "office-ui-fabric-react/lib/CommandBar";
import { gethAddress, rootAddress } from "./constants/api";
import { BZZRawGetAsync, BZZRawPostAsync } from "./utils/swarm";
import {
  decryptPayload,
  encryptPayload,
  generatePasteKey
} from "./utils/pasteHelper";
import "./App.css";

//@TODO Creating common Settings Panel from Pastebin
const defaultOptions = {
  selectOnLineNumbers: true,
  fontSize: 14,
  automaticLayout: true, // less performant
  lineNumbers: "on",
  theme: "vs",
  minimap: {
    enabled: false
  }
};

const defaults = {
  html: {
    label: "HTML",
    visible: true
  },
  javascript: {
    label: "Javascript",
    visible: true
  },
  css: {
    label: "CSS",
    visible: true
  }
};

const codeEditors = ["html", "javascript", "css"];
const DIVIDER_WIDTH = 1;

class App extends Component {
  state = {
    css: defaults.css.value,
    html: defaults.html.value,
    javascript: defaults.javascript.value,
    loading: false,
    readOnly: false,
    panels: {
      html: {
        size: 100,
        visible: defaults.html.visible
      },
      css: {
        size: 100,
        visible: defaults.css.visible
      },
      javascript: {
        size: 100,
        visible: defaults.javascript.visible
      }
    },
    panelWidths: []
  };

  componentDidMount() {
    let web3 = new Web3(new Web3.providers.HttpProvider(gethAddress));

    // Set web3 as global so it can be access via debugger
    window.web3 = web3;
    window.BigNumber = BigNumber;

    if (window.location.pathname.split("/")[1]) {
      this.getData(window.location.pathname.split("/")[1]);
    }
    this.distributePanelsEvenly();
  }

  compile = () => {
    this.setState(state => ({ consoleJs: state.javascript }));
    const iframe = this._iframe;
    if (!iframe) return;
    const code = iframe.contentWindow.document;

    code.open();
    code.writeln(this.state.html);

    // Set web3 so it can be used with `console.log()` in javascript snippets
    code.writeln(`<script>window.web3 = window.parent.web3</script>`);
    code.writeln(`<script>window.BigNumber = window.parent.BigNumber</script>`);
    code.writeln(`<style>${this.state.css}</style>`);
    code.writeln(`<script>${this.state.javascript}</script>`);
    code.close();
  };

  updateText(text, type) {
    this.setState({ [type]: text });
  }

  save = async () => {
    const payload = {
      html: this.state.html,
      css: this.state.css,
      javascript: this.state.javascript,
      createdAt: Date.now(),
      schema: 1
    };

    // Encrypt JSON Payload
    const key = generatePasteKey();
    const encryptedPayload = encryptPayload(payload, key);
    logger("## encrypted", encryptedPayload.toString());

    try {
      const hash = await BZZRawPostAsync(encryptedPayload);
      window.location.replace(`${rootAddress}/${hash}#${key}`);
    } catch (err) {
      alert(
        `There was an error saving your snippet'.\nPlease check console logs.`
      );
      logger("## save error: ", err);
    }
  };

  getData = async hash => {
    try {
      const payload = await BZZRawGetAsync(hash);
      const decryptedData = decryptPayload(payload);
      logger("## decrypted", decryptedData);

      // @TODO Check for malformed data
      this.updateText(decryptedData.html || defaults.html.value, "html");
      this.updateText(decryptedData.css || defaults.css.value, "css");
      this.updateText(
        decryptedData.javascript || defaults.javascript.value,
        "javascript"
      );

      this.compile();
    } catch (err) {
      alert(
        `There was an error accessing path 'bzz:/${hash}'.\nPlease check console logs.`
      );
      logger("## getData Error: ", err);
    }
  };

  getCommandBarItems() {
    return [
      {
        key: "title",
        name: "WEB3 Playground",
        className: "brand",
        onClick: () => window.location.replace(rootAddress)
      },
      {
        key: "run",
        name: "Run",
        icon: "Play",
        onClick: this.compile
      },
      {
        key: "save",
        name: "Save",
        icon: "Save",
        onClick: this.save
      }
    ];
  }

  getCommandBarFarItems() {
    return [
      {
        key: "particles",
        name: "Particles",
        icon: "backlog",
        onClick: () => console.log("Storage Panel")
      },
      {
        key: "settings",
        icon: "settings",
        onClick: () => console.log("Storage Panel")
      },
      {
        key: "info",
        icon: "info",
        onClick: () => console.log("Info Panel")
      }
    ];
  }

  distributePanelsEvenly() {
    const panelContainerWidth = document.getElementById("panel-container")
      .offsetWidth;
    const visiblePanels = codeEditors.filter(
      panel => this.state.panels[panel].visible
    );
    const panelWidth =
      panelContainerWidth / visiblePanels.length - DIVIDER_WIDTH;

    const updatedPanels = visiblePanels
      .map(p => ({
        visible: true,
        size: panelWidth
      }))
      .reduce((acc, cur, i) => {
        acc[visiblePanels[i]] = cur;
        return acc;
      }, {});

    const panelWidths = [];
    visiblePanels.forEach(panel => {
      panelWidths.push({ size: panelWidth });
    });

    this.setState(state => ({
      panelWidths,
      panels: {
        ...state.panels,
        ...updatedPanels
      }
    }));
  }

  togglePanel = panel => {
    const panels = codeEditors.reduce((acc, cur) => {
      acc[cur] = {
        size: this.state.panels[cur].size,
        visible:
          panel === cur
            ? !this.state.panels[cur].visible
            : this.state.panels[cur].visible
      };
      return acc;
    }, {});
    this.setState({ panels }, this.distributePanelsEvenly);
  };

  renderEditor(language) {
    const left = [
      {
        key: "title",
        name: language ? language.toUpperCase() : "",
        className: "no-hover brand"
      }
    ];
    const right = [
      {
        key: "copy",
        icon: "Copy",
        onClick: this.copyToClipboard
      }
    ];
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
          key={`key-${language}-${Math.floor(
            this.state.panels[language].size / 50
          )}`} // Rerender if changed by over 50px
          value={this.state[language] || ""}
          onChange={text => this.updateText(text, language)}
          options={defaultOptions}
          theme="vs"
          height="100%"
          language={language}
          width={this.state.panels[language].size}
        />
      </div>
    );
  }

  renderIFrame() {
    return (
      <div className="iframe-container">
        <iframe
          ref={i => (this._iframe = i)}
          title="Test"
          id="code"
          srcDoc="Result"
          style={{ width: "100%", height: "100%" }}
        />
      </div>
    );
  }

  renderPanels() {
    // NOTE: Seeing some buggy behavior when using { this.state.languageVisible && <Component /> } syntax
    // so I'm explicitly creating the component array instead [dan]
    const panels = [];
    codeEditors.forEach(language => {
      if (this.state.panels[language].visible)
        panels.push(this.renderEditor(language));
    });
    return panels;
  }

  onUpdatePanel = updatedWidths => {
    const updatedPanels = codeEditors
      .filter(p => this.state.panels[p].visible)
      .reduce((acc, cur, i) => {
        acc[cur] = {
          visible: true,
          size: updatedWidths[i].size
        };
        return acc;
      }, {});
    this.setState(state => ({
      panelWidths: updatedWidths.map(w => ({ size: w.size })),
      panels: { ...state.panels, ...updatedPanels }
    }));
  };

  render() {
    return (
      <div className="container">
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
      </div>
    );
  }
}

export default App;
