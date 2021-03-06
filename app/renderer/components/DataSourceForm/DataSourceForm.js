import React from 'react';
import ReactDOM from 'react-dom';
import ModalDialog from '../ModalDialog';
import Button from '../Button';
import DataSource from '../../../lib/DataSource';
import ProgressIcon from '../ProgressIcon';

export default class DataSourceForm extends React.Component {
  constructor(props) {
    super(props);

    let dataSource = props.dataSource || {};

    this.state = {
      selectedType: dataSource.type || null,
      connectionTestStatus: null,
      connectionTestMessage: null,
    };
  }

  getNameValue() {
    return ReactDOM.findDOMNode(this.refs.name).value;
  }

  getTypeValue() {
    return ReactDOM.findDOMNode(this.refs.type).value;
  }

  getConfigValues() {
    // TODO: validation
    let form = ReactDOM.findDOMNode(this.refs.form);
    let inputs = form.querySelectorAll('.DataSourceForm-configInput');
    let checkboxes = form.querySelectorAll('.DataSourceForm-configCheckbox');

    return Array.from(inputs).reduce((acc, el) => {
      return Object.assign(acc, { [el.name]: el.value });
    }, Array.from(checkboxes).reduce((acc, el) => {
      let value = el.checked ? el.value : "";
      return Object.assign(acc, { [el.name]: value });
    }, {}));
  }

  handleSave() {
    let id = this.props.dataSource ? this.props.dataSource.id : null;
    let name = this.getNameValue();
    let type = this.state.selectedType;
    let config = this.getConfigValues();
    this.props.onSave({ id, name, type, config });
  }

  handleCancel() {
    this.props.onCancel();
  }

  handleChangeType(e) {
    this.setState({ selectedType: e.target.value });
  }

  handleConnectionTest() {
    let type = this.state.selectedType;
    let config = this.getConfigValues();
    this.setState({ connectionTestStatus: 'working', connectionTestMessage: null });
    DataSource.create({ type, config }).connectionTest().then(() => {
      this.setState({ connectionTestStatus: 'success' });
    }).catch(err => {
      this.setState({ connectionTestStatus: 'failure', connectionTestMessage: err.message });
    });
  }

  renderConfigCheckbox(i, value, schema) {
    return <tr key={i} className={schema.required ? 'is-required' : ''}>
      <th>{schema.label}</th>
      <td>
        <input
          className="DataSourceForm-configCheckbox"
          type="checkbox"
          value={schema.value}
          name={schema.name}
          defaultChecked={schema.value == value ? 'checked' : ''}
          />
      </td>
    </tr>;
  }

  renderConfigInput(i, value, schema) {
    let type = schema.type === 'password' ? 'password' : 'text';
    return <tr key={i} className={schema.required ? 'is-required' : ''}>
      <th>{schema.label}</th>
      <td>
        <input
          className="DataSourceForm-configInput"
          type={type}
          defaultValue={value}
          name={schema.name}
          placeholder={schema.placeholder}
          />
      </td>
    </tr>;
  }

  renderConfig() {
    let ds = DataSource.get(this.state.selectedType);
    if (!ds) return null;

    return ds.configSchema.map((schema, i) => {
      let dataSource = this.props.dataSource || {};
      let config = dataSource.config || {};
      let value = config[schema.name];
      switch(schema.type) {
        case 'checkbox':
          return this.renderConfigCheckbox(i, value, schema);
        default:
          return this.renderConfigInput(i, value, schema);
      }
    });
  }


  render() {
    let dataSource = this.props.dataSource || {};
    let options = [{ key: '', label: '' }].concat(DataSource.list).map(({ key, label }) => {
      return <option key={key} value={key}>{label}</option>;
    });

    return <ModalDialog className="DataSourceForm">
      <table ref="form">
        <tbody>
          <tr className="is-required">
            <th>Name</th>
            <td><input ref="name" type="text" defaultValue={dataSource.name} name="name" placeholder="My Database" /></td>
          </tr>
          <tr className="is-required">
            <th>Type</th>
            <td>
              <select value={this.state.selectedType} name="type" onChange={this.handleChangeType.bind(this)}>
                {options}
              </select>
            </td>
          </tr>
          {this.renderConfig()}
        </tbody>
      </table>

      <div className="DataSourceForm-bottom">
        <div className="DataSourceForm-connectionTest">
          <Button onClick={() => this.handleConnectionTest()}>Connection Test</Button>
          {this.state.connectionTestStatus ? <ProgressIcon status={this.state.connectionTestStatus} /> : null}
          {this.state.connectionTestMessage ? <div className="DataSourceForm-connectionTestMessage">{this.state.connectionTestMessage}</div> : null}
        </div>
        <div className="DataSourceForm-buttons">
          <Button onClick={() => this.handleCancel()}>Cancel</Button>
          <Button onClick={() => this.handleSave()}>Save</Button>
        </div>
      </div>
    </ModalDialog>;
  }
}
