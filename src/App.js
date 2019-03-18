import React, { Component } from 'react';
import { Layout } from 'antd';
import Esjql from './esjql';
import { List } from './logentries';
import './App.css';
import './esjql/esjql.css';
import "antd/dist/antd.css";

class App extends Component {
  render() {
    return (
      <div className="App">
        <Layout className="layout">
          <Layout.Header>
            <div className="logo" />
          </Layout.Header>
          <Layout.Content>
            <div style={{ background: '#fff', padding: 24, minHeight: 280 }}>
              <Esjql resultComponent={List} searchUrl='/logentries' />
            </div>
          </Layout.Content>
        </Layout>
      </div>
    );
  }
}

export default App;
