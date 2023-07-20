import React from 'react';
import { writeText } from '@tauri-apps/api/clipboard';
import JSONEditor from '@/component/JSONEditor'
import { Button, Message, Grid, Space, Card, Tag, Empty, Divider, Modal, Form, Input } from '@arco-design/web-react';
import { IconExclamation, IconLoading, IconEdit } from '@arco-design/web-react/icon';
import api from '@/util/api';
import cache from '@/util/cache';
import invoke from '@/util/invoke';
import dayjs from 'dayjs';
import { message } from 'antd';
const Row = Grid.Row;
const Col = Grid.Col;
const FormItem = Form.Item;

class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            editing: false,
            host: "",
            privateKey: "",
            localConfig: {},
        }
    }
    async componentDidMount() {
        let data = await cache.getCacheHost()
        console.log(data)
        await this.setState(data)
    }
    doSaveCacheHost = async () => {
        await cache.setCacheHost({
            host : this.state.host,
            privateKey : this.state.privateKey,
        })
        await this.setState({
            editing : false
        })
        Message.success("保存成功")
    }
    getLocalConfig = async () => {
        let data = await invoke.getLocalConfig(this.state.host, this.state.privateKey)
        console.log(JSON.parse(data[0]))
    }
    

    render() {
        return <>
            <Row gutter={20}>
                <Col span={24} style={{ marginBottom: '20px' }}>
                    <Card title="配置">
                        <Form autoComplete='off'>
                            <FormItem label='内网IP'>
                                <Input placeholder='请填写服务内网IP' disabled={!this.state.editing} onChange={(val) => {
                                    this.setState({host : val})
                                }} value={this.state.host}/>
                            </FormItem>
                            <FormItem label='密钥'>
                                <Input.TextArea placeholder='请填写密钥内容' disabled={!this.state.editing} rows={4} onChange={(val) => {
                                    this.setState({privateKey : val})
                                }} value={this.state.privateKey}></Input.TextArea>
                            </FormItem>
                            <FormItem wrapperCol={{ offset: 5 }}>
                                {
                                    this.state.editing ? <Button type='primary' onClick={this.doSaveCacheHost}>保存</Button> : <Button type='primary' onClick={() => {
                                        this.setState({ editing: true })
                                    }}>编辑</Button>
                                }
                            </FormItem>
                        </Form>
                        <Divider></Divider>
                        <Button onClick={this.getLocalConfig} type='primary'>获取LocalConfig</Button>
                    </Card>
                </Col>
            </Row>
        </>
    }
}


export default App
