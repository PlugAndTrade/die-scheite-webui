import React, { Component } from 'react';
import { AutoComplete, Button, Icon, Input, Select, Spin } from 'antd';
import * as R from 'ramda';

const toNonEmptyString = R.pipe(R.when(R.complement(R.is(String)), R.toString), R.when(R.isEmpty, R.always('<empty>')));

const isValidFilter = R.allPass([R.is(String), R.complement(R.isEmpty)]);

const EsjqlProperty = (props) => {
  let { property: { type }} = props;

  if (R.either(R.equals('nested'), R.equals('object'))(type)) {
    return (<EsjqlObjectPropertyMenu {...props} />);
  } else {
    return (<EsjqlItemPropertyMenu {...props} />);
  }
};

class EsjqlObjectPropertyMenu extends Component {
  state = {
    collapsed: true,
    newProperty: ''
  }

  toggleCollapsed() {
    this.setState({collapsed: !this.state.collapsed});
  }

  setNewProperty(newProperty) {
    this.setState({newProperty});
  }

  addProperty() {
    let { newProperty } = this.state;
    let { property: {name}, parents, addProperty } = this.props;
    let path = R.append(name, parents);
    addProperty(path, {name: newProperty, type: 'keyword'});
    this.setState({newProperty: ''});
  }

  render() {
    let { collapsed, newProperty } = this.state;
    let { property, parents, addFilter, addProperty, getAutoCompleteValues } = this.props;
    let { dynamic, name, children } = property;

    return (
      <div className='esjql__item-menu'>
        <div className='title' style={{}}>
          <span className="connector" ></span>
          <Button style={{marginRight: '10px'}} onClick={this.toggleCollapsed.bind(this)} icon={collapsed ? 'down' : 'up'} >
            {property.name}
          </Button>
        </div>
        {collapsed ? (<></>) : (<>
          <ul
            className='esjql__menu'
            style={{
            }}
          >
            {dynamic ? (
              <li>
                <div className="title">
                  <span className="connector" ></span>
                  <Input value={newProperty} style={{width: '80%'}} onChange={(e) => this.setNewProperty(e.target.value)} />
                  <Button
                    {...(R.isEmpty(newProperty) ? {disabled: true} : {})}
                    onClick={this.addProperty.bind(this)}
                  >
                    Add property
                  </Button>
                </div>
              </li>
            ) : (<></>)}
            {children.map(prop => (
              <li key={prop.name}>
                <EsjqlProperty addProperty={addProperty} addFilter={addFilter} getAutoCompleteValues={getAutoCompleteValues} parents={R.append(name, parents)} property={prop} />
              </li>
            ))}
          </ul>
        </>)}
      </div>
    );
  }
}

class EsjqlItemPropertyMenu extends Component {
  state = {
    filter: '',
    op: '',
    values: [],
    loading: false
  }

  setFilters() {
    let { filter, op } = this.state;
    let { property: { name, filters }, parents, addFilter } = this.props;
    let path = R.append(name, parents);

    if (!R.isEmpty(filter)) {
      addFilter(path, R.pipe(R.append(`${op}${filter}`), R.uniq)(filters));
      this.setState({filter: '', op: ''});
    }
  }

  getAutoCompleteValues() {
    let { property: { name }, parents, getAutoCompleteValues } = this.props;
    let path = R.append(name, parents);

    this.setState({loading: true});
    getAutoCompleteValues(path)
      .then(values => this.setState({values}))
      .finally(() => this.setState({loading: false}));
  }

  removeFilter(filter) {
    let { property: { name, filters }, parents, addFilter } = this.props;
    let path = R.append(name, parents);
    addFilter(path, R.reject(R.equals(filter))(filters));
  }

  handleFilterChange(filter) {
    R.pipe(R.defaultTo(''), R.objOf('filter'), R.invoker(1, 'setState')(R.__, this))(filter);
  }

  handleOpChange(op) {
    this.setState({op});
  }

  render() {
    let { filter, op, values, loading } = this.state;
    let { property: { type, name, filters }} = this.props;

    let opSelector = (
      <Select value={op} onChange={this.handleOpChange.bind(this)}>
        <Select.Option value=''>{'='}</Select.Option>
        <Select.Option value='>='>{'>='}</Select.Option>
        <Select.Option value='<='>{'<='}</Select.Option>
        <Select.Option value='>'>{'>'}</Select.Option>
        <Select.Option value='<'>{'<'}</Select.Option>
        <Select.Option value='^'>{'^'}</Select.Option>
        <Select.Option value='~'>{'~'}</Select.Option>
      </Select>
    );

    let valuesList = loading
      ? [(<AutoComplete.Option key='loading' disabled>Loading... <Spin indicator={(<Icon type='loading' />)} /></AutoComplete.Option>)]
      : values.map(({value, count}) => (<AutoComplete.Option key={toNonEmptyString(value)} value={toNonEmptyString(value)}>
        {toNonEmptyString(value)} <span style={{float: 'right', color: 'rgba(0, 0, 0, 0.25)'}}>{count}</span>
      </AutoComplete.Option>));

    return (
      <div className='esjql__item-menu'>
        <div className='title'>
          <span className="connector" ></span>
          <span>{`${name} (${type})`}</span>
        </div>
        <div className="esjql__filter-input">
          {opSelector}
          <AutoComplete
            allowClear
            optionLabelProp='value'
            value={filter}
            dataSource={valuesList}
            onChange={this.handleFilterChange.bind(this)}
            onFocus={this.getAutoCompleteValues.bind(this)}
          >
            <Input />
          </AutoComplete>
          <Button
            {...(isValidFilter(filter) ? {} : {disabled: true})}
            onClick={this.setFilters.bind(this)}
            icon='filter' />
        </div>
        <ul className='esjql__filter-list'>
        {filters.map(filter => (
            <li key={filter}>
              <Icon type='delete' onClick={() => this.removeFilter(filter)} />
              <span className='esjql__filter-value' style={{'margin-left': '10px'}}>{filter}</span>
            </li>
        ))}
        </ul>
      </div>
    );
  }
}

class EsjqlMenu extends Component {
  render() {
    let { properties, addFilter, addProperty, getAutoCompleteValues, style } = this.props;
    return (
      <ul className='esjql__menu' style={style || {}}>
        {properties.map(prop => (
          <li key={prop.name}><EsjqlProperty addProperty={addProperty} addFilter={addFilter} getAutoCompleteValues={getAutoCompleteValues} property={prop} parents={[]} /></li>
        ))}
      </ul>
    );
  }
}

export default EsjqlMenu;
