import React, { Component, Fragment } from 'react';
import * as R from 'ramda';
import { Button, Empty, Icon, message, Row, Col, Spin } from 'antd';
import EsjqlMenu from './Menu';
import { search, getProperties, getValues } from './api';

const addFilter = (path, values, properties) => {
  let idx = R.findIndex(R.propSatisfies(R.equals(R.head(path)), 'name'), properties);
  let tail = R.tail(path);
  return R.over(
    R.lensIndex(idx),
    R.isEmpty(tail)
      ? R.assoc('filters', values)
      : R.over(R.lensProp('children'), (c) => addFilter(R.tail(path), values, c)),
    properties
  );
};

const addProperty = (path, property, properties) => {
  if (R.isEmpty(path)) {
    return R.prepend(property, properties);
  } else {
    let idx = R.findIndex(R.propSatisfies(R.equals(R.head(path)), 'name'), properties);
    return R.over(
      R.lensIndex(idx),
      R.over(R.lensProp('children'), c => addProperty(R.tail(path), property, c)),
      properties
    );
  }
};

const initFilters = R.map(R.pipe(
  R.assoc('filters', []),
  R.over(R.lensProp('children'), R.when(R.complement(R.isNil), c => initFilters(c)))
));

const collectFilters = (properties, parents) => {
  return R.pipe(
    R.map(R.converge(
      R.merge,
      [
        R.converge(R.objOf, [
          R.pipe(R.prop('name'), R.append(R.__, parents), R.join('.')),
          R.prop('filters')
        ]),
        ({name, children}) => collectFilters(children || [], R.append(name, parents))
      ]
    )),
    R.reduce(R.merge, {})
  )(properties);
};

class Esjql extends Component {
  state = {
    total: 0,
    loading: false,
    size: 10,
    items: [],
    properties: []
  }

  componentDidMount() {
    this.getAllProperties();
  }

  getAllProperties() {
    let { searchUrl } = this.props;
    this.setState({loading: true});

    return getProperties(searchUrl)
      .then(initFilters)
      .then(properties => this.setState({properties}))
      .finally(() => this.setState({loading: false}))
      ;
  }

  getAutoCompleteValues(path) {
    let { searchUrl } = this.props;
    let property = R.join('.')(path);
    return getValues(searchUrl, [property])
      .then(R.prop(property));
  }

  search() {
    let { searchUrl } = this.props;
    let { properties, size } = this.state;
    let filters = collectFilters(properties, []);
    this.setState({loading: true});

    search(searchUrl, filters, size)
      .then(r => this.setState({items: r.resultset, total: r.total}))
      .catch(({errors}) => errors && !R.isEmpty(errors)
        ? errors.forEach(error => message.error(`${error.code}: ${error.message}`))
        : message.error("Unknown error")
      )
      .finally(() => this.setState({loading: false}))
      ;
  }

  addFilter(path, value) {
    let { properties } = this.state;
    let filtered = addFilter(path, value, properties);
    this.setState({properties: filtered});
  }

  addProperty(path, property) {
    let { properties } = this.state;
    let filtered = addProperty(path, R.mergeRight({filters: []}, property), properties);
    this.setState({properties: filtered});
  }

  render() {
    let { loading, properties, total, items } = this.state;
    const ResultComponent = this.props.resultComponent || Fragment;

    return (
      <Row>
        <Col span={6}>
          <EsjqlMenu
            getAutoCompleteValues={this.getAutoCompleteValues.bind(this)}
            addProperty={this.addProperty.bind(this)}
            addFilter={this.addFilter.bind(this)}
            properties={properties} />
        </Col>
        <Col span={18}>
        <Button onClick={() => this.search()}>Search</Button>
        <div>
          {loading ? (<Spin indicator={(<Icon type='loading' />)} />) : (<></>)}
        </div>
        {items.length > 0 ? (<ResultComponent total={total} items={items} />) : (<Empty />)}
        </Col>
      </Row>
    );
  }
}

export default Esjql;
