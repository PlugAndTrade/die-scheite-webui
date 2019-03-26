import * as R from 'ramda';
import React, { Component } from 'react';
import { Badge, Button, Icon, List, Modal } from 'antd';

const levelIcons = {
  TRACE: 'info-circle',
  DEBUG: 'info-circle',
  INFO: 'info-circle',
  WARNING: 'warning',
  ERROR: 'exclamation-circle',
  CRITICAL: 'exclamation-circle',
};

const levelColors = {
  TRACE: '#1890ff',
  DEBUG: '#1890ff',
  INFO: '#1890ff',
  WARNING: '#faad14',
  ERROR: '#f5222d',
  CRITICAL: '#f5222d',
};

class LogListItem extends Component {
  state = {
    collapsed: true,
    showJson: false
  }
  
  toggleCollapsed() {
    this.setState({collapsed: !this.state.collapsed});
  }

  showJson() {
    this.setState({showJson: true});
  }

  hideJson() {
    this.setState({showJson: false});
  }

  downloadAttachment(id) {
    fetch(`/attachments/${id}`)
      .then(R.cond([
        [ R.pipe(R.prop('headers'), R.invoker(1, 'get')('Content-Type'), R.equals('application/json')), R.invoker(0, 'json') ],
        [ R.T, () => R.invoker(0, 'text') ]
      ]))
      .then(R.when(R.complement(R.is(String)), d => JSON.stringify(d, null, 2)))
      .then(data => Modal.info({
        icon: 'paper-clip',
        keyboard: true,
        content: (<pre>{data}</pre>)
      }));
  }

  render() {
    let { item } = this.props;
    let { collapsed, showJson } = this.state;
    let level = item.levelCategory || "TRACE";
    return (
      <List.Item>
        <Icon style={{color: levelColors[level]}} type={levelIcons[level]} theme='filled' />
        [{level}]
        <span style={{padding: '0 11px'}}>
          <Icon type='clock-circle' />
          {new Date(item.timestamp).toLocaleDateString('sv-SE', {hour: '2-digit', minute: '2-digit', second: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric'})}
          ({item.duration} ms)
        </span>
        {item.serviceId}
        <Button icon={collapsed ? 'down' : 'up'} style={{}} onClick={this.toggleCollapsed.bind(this)}/>
        <Badge count={(item.messages && item.messages.length) || 0} showZero={true} />
        {collapsed ? (<></>) : (<List
          itemLayout='horizontal'
          bordered
          dataSource={item.messages}
          renderItem={message => (<List.Item>{message.message}<span>{message.attachments.map(a => (<Button onClick={() => this.downloadAttachment(a.id)} ><Icon type="paper-clip" />{a.name}</Button>))}</span></List.Item>)} />
        )}
        <Button
          onClick={this.showJson.bind(this)}
        >
        Json <Icon type='' />
        </Button>
        <Modal
          width={1040}
          visible={showJson}
          onOk={this.hideJson.bind(this)}
          onCancel={this.hideJson.bind(this)}
        >
          <div><pre>{JSON.stringify(item, null, 2)}</pre></div>
        </Modal>
      </List.Item>
    );
  }
}

class LogList extends Component {
  render() {
    let { items, total } = this.props;
    return (
      <List
        itemLayout='horizontal'
        header={(<div>{total} log entries</div>)}
        bordered
        dataSource={items}
        renderItem={item => (<LogListItem item={item} />)}
      />
    );
  }
}

export default LogList;
