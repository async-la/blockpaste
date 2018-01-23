import React, { Component } from 'react'
import { DefaultButton } from 'office-ui-fabric-react/lib/Button'
import { Dropdown } from 'office-ui-fabric-react/lib/Dropdown'
import { Label } from 'office-ui-fabric-react/lib/Label'
import { Panel, PanelType } from 'office-ui-fabric-react/lib/Panel'
import { Toggle } from 'office-ui-fabric-react/lib/Toggle'

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
        headerText="Settings"
        closeButtonAriaLabel="Close"
      >
        <Label>Theme</Label>
        <Dropdown
          style={{ marginTop: 4, width: '200px', textAlign: 'center' }}
          options={THEMES}
          selectedKey={this.props.theme}
          onChanged={this.handleThemeChange}
        />
        <Label>Font Size</Label>
        <Dropdown
          style={{ marginTop: 4, width: '200px', textAlign: 'center' }}
          options={FONT_SIZES}
          selectedKey={this.props.fontSize}
          onChanged={this.handleFontSizeChange}
        />
        <Toggle
          checked={!!(this.props.lineNumbersOn === 'on')}
          label="Line Numbers"
          onText="On"
          offText="Off"
          onChanged={lineNumbersOn =>
            this.props.onChangeLineNumbersOn(lineNumbersOn ? 'on' : 'off')
          }
        />
        <DefaultButton
          style={{ marginTop: 15 }}
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
