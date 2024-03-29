import React, { Component } from 'react'
import { DefaultButton } from 'office-ui-fabric-react/lib/Button'
import { Dropdown } from 'office-ui-fabric-react/lib/Dropdown'
import { Label } from 'office-ui-fabric-react/lib/Label'
import { Panel, PanelType } from 'office-ui-fabric-react/lib/Panel'
import { Toggle } from 'office-ui-fabric-react/lib/Toggle'
import './SettingsPanel.css'

const THEMES = [
  {
    key: 'vs',
    text: 'light',
  },
  {
    key: 'vs-dark',
    text: 'dark',
  },
  {
    key: 'hc-black',
    text: 'high contrast',
  },
]

const FONT_SIZES = []
for (let i = 8; i < 60; i += 2) {
  FONT_SIZES.push({ key: i, text: i + 'pt' })
}

class SettingsPanel extends Component {
  handleThemeChange = e => {
    const { key } = e
    this.props.onChangeTheme(key)
  }

  handleFontSizeChange = e => {
    const { key } = e
    this.props.onChangeFontSize(key)
  }

  render() {
    return (
      <Panel
        isBlocking={false}
        isOpen={this.props.isOpen}
        type={PanelType.smallFixedFar}
        onDismiss={this.props.onDismiss}
        closeButtonAriaLabel="Close"
        headerText={<Label style={{ fontSize: 30 }}>Settings</Label>}
      >
        <div className="settings-spacing flex-row-space-between">
          <Label>Line Numbers</Label>
          <Toggle
            checked={!!(this.props.lineNumbersOn === 'on')}
            onText="On"
            offText="Off"
            onChanged={lineNumbersOn =>
              this.props.onChangeLineNumbersOn(lineNumbersOn ? 'on' : 'off')
            }
          />
        </div>
        <div className="settings-spacing">
          <Label>Theme</Label>
          <Dropdown
            className="drop-down"
            options={THEMES}
            selectedKey={this.props.theme}
            onChanged={this.handleThemeChange}
          />
        </div>
        <div className="settings-spacing">
          <Label>Font Size</Label>
          <Dropdown
            className="drop-down"
            options={FONT_SIZES}
            selectedKey={this.props.fontSize}
            onChanged={this.handleFontSizeChange}
          />
        </div>
        <DefaultButton
          primary
          data-automation-id="test"
          text="Done"
          onClick={this.props.onDismiss}
        />
      </Panel>
    )
  }
}

export default SettingsPanel
