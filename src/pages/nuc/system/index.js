import React from 'react';
import { Button, Message, Grid, Space, Card, Tag, Empty, Divider, Modal } from '@arco-design/web-react';
import { IconExclamation, IconLoading } from '@arco-design/web-react/icon';
import api from '@/util/api';
import dayjs from 'dayjs';
const Row = Grid.Row;
const Col = Grid.Col;
import { writeText } from '@tauri-apps/api/clipboard';
import JSONEditor from '@/component/JSONEditor'
const VrTaskParamsTip = {

}

const EditDataTypeText = {
    'vr_task_global_params' : 'VR任务全局参数',
    'host_list' : '域名信息'
}

class App extends React.Component {
    json = null
    constructor(props) {
        super(props);
        this.state = {
            system: null,
            loading: false,
            vr_task_global_params: {},
            host_list: {},

            visible : false,
            json : {},
            jsonDataType : '',
        }
    }
    async componentDidMount() {
        await this.getSystemData()
        await this.getVRTaskGlobalParams()
        await this.getHostList()
    }
    getSystemData = async () => {
        if (this.state.loading) {
            return
        }
        await this.setState({
            loading: true,
        })
        let data = await api.getNucSystemInfo()
        if (data.code != 0) {
            Message.error(data.status)
            this.setState({
                system: null,
                loading: false
            })
            return
        }
        if (!data.data.Success) {
            this.setState({
                system: null,
                loading: false
            })
            return
        }
        this.setState({
            system: data.data.Result,
            loading: false,
        })
    }
    getVRTaskGlobalParams = async () => {
        await this.setState({
            loading: true,
            vr_task_global_params: {},
        })
        let data = await api.queryVrapiV2({
            table: 'strategy',
            query: {
                'name': 'realsee-open-svc',
                '`key`': 'vr_task.global_alg_params'
            }
        })
        console.log(data)
        await this.setState({
            loading: false
        })
        if (data.code != 0) {
            Message.error(data.status)
            return
        }
        if (data.data.list.length < 1) {
            Message.error("not found")
            return
        }
        let params = JSON.parse(data.data.list[0].value)
        await this.setState({
            vr_task_global_params: params
        })
    }
    getHostList = async () => {
        await this.setState({
            loading: true,
            host_list: {},
        })
        let data = await api.queryVrapiV2({
            table: 'strategy',
            query: {
                'name': 'vrfile',
                '`key`': 'local_config'
            }
        })
        await this.setState({
            loading: false
        })
        if (data.code != 0) {
            Message.error(data.status)
            return
        }
        if (data.data.list.length < 1) {
            Message.error("host list config not found")
            return
        }
        let params = JSON.parse(data.data.list[0].value)
        await this.setState({
            host_list: params
        })
    }
    refresh = async () => {
        await this.getSystemData()
        await this.getVRTaskGlobalParams()
        await this.getHostList()
    }
    htmlTitle = () => {
        return <h3><Space>
            主机
            <Button onClick={this.refresh} type='primary' size="mini">刷新</Button>
        </Space></h3>
    }
    fixNucTime = async () => {
        let result = await api.setNucTime(dayjs().unix())
        if (result.code < 0) {
            Message.error(result.status)
            return
        }
        Message.success("修正成功")
        this.getSystemData()
    }
    copyData = async (data) => {
        await writeText(JSON.stringify(data))
        Message.success("复制成功")
    }
    editData = async (dataType, data) => {
        await this.setState({
            json : {},
            jsonDataType : dataType,
            visible : true,
        })
        setTimeout( () =>  this.json.set(data), 300)
       
    }
    doUpdateJSON = async () => {
        console.log(this.state.json)
        let result = null
        if(this.state.jsonDataType == 'vr_task_global_params') {
            result = await api.updateVrTaskGlobalParams(this.state.json)
        } else if (this.state.jsonDataType == 'host_list') {
            result = await api.updateVRFileLocalConfig(this.state.json)
        }
        if(result == null) {
            return
        }
        if(result.code != 0) {
            Message.error(result.status)
            return
        }
        Message.success('修改成功')
        await this.setState({
            visible : false
        })
        this.refresh()
    }

    render() {
        if (this.state.loading) {
            return <Card>
                <Empty
                    icon={
                        <div
                            style={{
                                background: '#0099CC',
                                display: 'inline-flex',
                                borderRadius: '50%',
                                width: 50,
                                height: 50,
                                fontSize: 30,
                                alignItems: 'center',
                                color: 'white',
                                justifyContent: 'center',
                            }}
                        >
                            <IconLoading />
                        </div>
                    }
                    description='努力加载中...'
                /></Card>
        }
        if (this.state.system == null) {
            return <Empty
                icon={
                    <div
                        style={{
                            background: '#f2994b',
                            display: 'inline-flex',
                            borderRadius: '50%',
                            width: 50,
                            height: 50,
                            fontSize: 30,
                            alignItems: 'center',
                            color: 'white',
                            justifyContent: 'center',
                        }}
                    >
                        <IconExclamation />
                    </div>
                }
                description='暂无系统信息'
            />
        }
        return <>
            <Row gutter={20}>
                <Col span={24} style={{ marginBottom: '20px' }}>
                    <Card title="基本信息">
                        <p><strong>NUC设备序列号：</strong>{this.state.system.DeviceSN}</p>
                        <p><strong>以太网卡MAC地址：</strong>{this.state.system.AddressEth}</p>
                        <p><strong>Wifi网卡MAC地址：</strong>{this.state.system.AddressWlan}</p>
                        <p><strong>系统是否已经封口：</strong>{this.state.system.Sealed ? '是' : '否'}</p>
                        <p><strong>系统初始化时间：</strong>{this.state.system.SystemInitDate}</p>
                        <p><strong>Uname：</strong>{this.state.system.Uname}</p>
                        <p><strong>系统UTC时间：</strong>{this.state.system.UTCTime} <Button type="primary" size="mini" onClick={this.fixNucTime}>修正时间</Button></p>
                        <p><strong>平均负载：</strong>
                            <Space>
                                <Tag> {this.state.system.Resource.Load[0]}（1分钟）</Tag>
                                <Tag> {this.state.system.Resource.Load[1]}（5分钟）</Tag>
                                <Tag> {this.state.system.Resource.Load[2]}（15分钟）</Tag>
                            </Space>
                        </p>
                    </Card>
                </Col>
                <Col span={24} style={{ marginBottom: '20px' }}>
                    <Card title="文件系统">
                        <Row gutter={30}>
                            {this.state.system.Resource.Storage.map(item => {
                                return <Col span={12}>
                                    <Divider orientation='left'>{item.file_system}</Divider>
                                    <p><strong>文件系统容量：</strong>{(item.total / 1024 / 1024).toFixed(2)}GB</p>
                                    <p><strong>文件系统使用量：</strong>{(item.used / 1024 / 1024).toFixed(2)}GB</p>
                                    <p><strong>文件系统使用量（百分比）</strong>{item.capacity}</p>
                                </Col>
                            })}
                        </Row>
                    </Card>
                </Col>
                <Col span={12} style={{ marginBottom: '20px' }}>
                    <Card title="CPU" style={{ height: '230px' }}>
                        <p><strong>CPU类型：</strong>{this.state.system.Resource.CPU.Model}</p>
                        <p><strong>core数：</strong>{this.state.system.Resource.CPU.Cores}</p>
                        <p><strong>thread数：</strong>{this.state.system.Resource.CPU.Threads}</p>
                        <p><strong>CPU 百万条指令每秒：</strong>{this.state.system.Resource.CPU.BogoMIPS}</p>
                    </Card>
                </Col>
                <Col span={12} style={{ marginBottom: '20px' }}>
                    <Card title="RAM" style={{ height: '230px' }}>
                        <p><strong>总内存量：</strong>{(this.state.system.Resource.RAM.Total / 1024 / 1024).toFixed(2)}GB</p>
                        <p><strong>空闲内存量：</strong>{(this.state.system.Resource.RAM.Free / 1024 / 1024).toFixed(2)}GB</p>
                        <p><strong>交换空间空闲量：</strong>{(this.state.system.Resource.RAM.Swap / 1024 / 1024).toFixed(2)}</p>
                    </Card>
                </Col>
                <Col span={12}>
                    <Card title="VR任务全局参数" extra={
                        <><Button type="text" onClick={this.copyData.bind(this, this.state.vr_task_global_params)}>复制</Button>
                        <Button type="text" onClick={this.editData.bind(this, 'vr_task_global_params', this.state.vr_task_global_params)}>修改</Button></>}>
                        {
                            Object.keys(this.state.vr_task_global_params).map(item => {
                                return <p><strong>{item}：</strong>{this.state.vr_task_global_params[item]}</p>
                            })
                        }
                    </Card>
                </Col>
                <Col span={12}>
                    <Card title="域名信息" extra={<><Button type="text" onClick={this.copyData.bind(this, this.state.host_list)}>复制</Button>
                    <Button type="text" onClick={this.editData.bind(this, 'host_list', this.state.host_list)}>修改</Button></>}>
                        {
                            Object.keys(this.state.host_list).map(item => {
                                return <p><strong>{item}：</strong>{this.state.host_list[item]}</p>
                            })
                        }
                    </Card>
                </Col>
            </Row>
            <Modal visible={this.state.visible} onCancel={()=> this.setState({visible: false})} style={{width:'60%'}} title={'修改`' + EditDataTypeText[this.state.jsonDataType] + '`'} onOk={this.doUpdateJSON}>
                <JSONEditor height={300} ref={(ele) => this.json = ele} json={this.state.json} onValidate={(val) => {
                    this.setState({json:val})
                }}/>
            </Modal>
        </>
    }
}


export default App
