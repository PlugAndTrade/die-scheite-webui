import React, { Component } from 'react';
import { Button, Form, Select } from 'antd';
import * as R from 'ramda';
import { getValues } from './api';

const flatten_form_values = (values) => {
  return R.pipe(
    R.toPairs,
    R.map(([k, v]) => {
      if (typeof v === 'object' && !Array.isArray(v)) {
        return R.pipe(
          flatten_form_values,
          R.toPairs,
          R.map(([k2, v]) => [`${k}.${k2}`, v])
        )(v);
      } else {
        return [[k, v]];
      }
    }),
    R.unnest,
    R.fromPairs
  )(values);
}

class EsjqlFilter extends Component {
  state = {
    values: []
  }

  componentDidMount() {
    getValues(this.props.url, [this.props.property.name])
      .then(R.prop(this.props.property.name))
      .then(values => this.setState({values}));
  }

  render() {
    let { values } = this.state;
    const { getFieldDecorator } = this.props.form;
    let { property } = this.props;
    let { name, type } = property;

    return (
      <Form.Item key={name} label={`${name} (${type})`}>
        {getFieldDecorator(name, {})(
          <Select
            placeholder={name}
            mode='tags'
            style={{width: '300px'}}
          >
            {values.filter(v => v.length > 0).map(v => (<Select.Option key={v}>{v}</Select.Option>))}
          </Select>
        )}
      </Form.Item>
    );
  }
}

class EsjqlForm extends Component {
  state = {
    filters: []
  }

  handleSubmit(e) {
    e.preventDefault();
    const { search } = this.props;
    this.props.form.validateFields((err, values) => {
      if (!err) {
        search(flatten_form_values(values));
      }
    });
  }

  handleFiltersChange(filters) {
    this.setState({filters});
  }

  render() {
    let { properties, url } = this.props;
    let { filters } = this.state;

    let propertyMap = R.reduce((map, p) => R.assoc(p.name, p, map), {}, properties);

    return (<>
      <Select
        placeholder='Add filter'
        mode='tags'
        onChange={this.handleFiltersChange.bind(this)}
        style={{width: '300px'}}
      >
        {properties.map(p => (<Select.Option key={p.name}>{p.name}</Select.Option>))}
      </Select>
      <Form style={{}} layout='inline' onSubmit={this.handleSubmit.bind(this)}>
        {filters.map(filter => (<EsjqlFilter key={filter} url={url} form={this.props.form} property={propertyMap[filter]} />))}
        <Form.Item><Button type='primary' htmlType='submit'>Search</Button></Form.Item>
      </Form>
    </>);
  }
}

export default Form.create({ name: 'esjql_form' })(EsjqlForm);
