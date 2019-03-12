import React, { Component, Fragment } from 'react';
import * as R from 'ramda';
import { Empty, Icon, Row, Col, Spin } from 'antd';
import EsjqlForm from './Form';
import { search, getProperties } from './api';

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
      .then(R.map(R.assoc('values', [])))
      .then(properties => this.setState({properties}))
      .finally(() => this.setState({loading: false}))
      ;
  }

  getAllPropertiesValues(properties) {
    let { searchUrl } = this.props;
    this.setState({loading: true});

    let qs = R.pipe(
      R.map(({name}) => `_aggs[]=${name}`),
      R.join('&')
    )(properties);

    fetch(`${searchUrl}?${qs}&_size=0`)
      .then(r => r.json())
      .then(R.pipe(
        R.prop('aggregations'),
        R.map(R.juxt([R.prop('property'), R.prop('values')])),
        R.fromPairs
      ))
      .then(res => this.setState({
        properties: R.map(p => R.assoc('values', R.propOr([], p.name, res), p), properties)
      }))
      .finally(() => this.setState({loading: false}))
      ;
  }

  search(filters) {
    let { searchUrl } = this.props;
    let { size } = this.state;
    this.setState({loading: true});

    search(searchUrl, filters, size)
      .then(r => this.setState({items: r.resultset, total: r.total}))
      .finally(() => this.setState({loading: false}))
      ;
  }

  render() {
    let { searchUrl } = this.props;
    let { loading, properties, total, items } = this.state;
    const ResultComponent = this.props.resultComponent || Fragment;

    return (
      <Row>
        <EsjqlForm properties={properties} url={searchUrl} search={this.search.bind(this)}/>
        <div>
          {loading ? (<Spin indicator={(<Icon type='loading' />)} />) : (<></>)}
        </div>
        {items.length > 0 ? (<ResultComponent total={total} items={items} />) : (<Empty />)}
      </Row>
    );
  }
}

export default Esjql;
