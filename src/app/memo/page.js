'use client'
import React from 'react'
import { Card, Avatar, Link, Typography, Space, Input, Button, Message, Radio, Divider, Modal, Grid } from '@arco-design/web-react';
import api from '@/util/api'
import cache from '@/util/cache'
import JSONEditor from '@/component/JSONEditor';
import MDEditor from '@/component/MDEditor';
import MDViewer from '@/component/MDViewer';
import { exists, readDir, createDir, BaseDirectory, writeTextFile, readTextFile, removeFile } from '@tauri-apps/api/fs';
import dayjs from 'dayjs';
const RadioGroup = Radio.Group;
const Row = Grid.Row;
const Col = Grid.Col;

const initMemoDir = async () => {
    let flag = await exists('memo', { dir: BaseDirectory.AppData });
    if (flag) {
        return
    }
    await createDir('memo', { dir: BaseDirectory.AppData, recursive: true });
    return
}

const readMemo = async () => {
    const { sep } = await import('@tauri-apps/api/path')
    let list = await readDir('memo', { dir: BaseDirectory.AppData, recursive: false });
    console.log(list);
    let retData = [];
    for (var i in list) {
        let contents = await readTextFile('memo' + sep + list[i].name, { dir: BaseDirectory.AppData });
        console.log(contents);
        retData.push({
            name: list[i].name,
            time: dayjs.unix(list[i].name).format('YYYY-MM-DD HH:mm:ss'),
            content: contents
        })
    }
    retData = retData.sort((a,b) => {
        return b.name - a.name;
    })
    return retData;
}

const writeMemo = async (name, content) => {
    const { sep } = await import('@tauri-apps/api/path')
    return await writeTextFile('memo' + sep + name, content, { dir: BaseDirectory.AppData });
}

const deleteMemo = async (name) => {
    const { sep } = await import('@tauri-apps/api/path')
    return await removeFile('memo' + sep + name, { dir: BaseDirectory.AppData, recursive: false });
}

export default function App() {
    var editor = null;
    const [value, setValue] = React.useState('')
    const [list, setList] = React.useState([])
    const [editName, setEditName] = React.useState('')

    const saveMessage = async () => {
        if (value.trim().length < 1) {
            return
        }
        let name = editName || dayjs().unix()
        await writeMemo(name, value)
        Message.success('保存成功')
        setValue('')
        setEditName('')
        getSetMemo()
    }
    const getSetMemo = async () => {
        let list = await readMemo()
        setList(list)
    }

    const handleDeleteMemo = async (item) => {
        Modal.confirm({
            title : '删除提醒',
            content : '确认删除这条记录？',
            onOk : async () => {
                await deleteMemo(item.name)
                Message.success('删除成功')
                getSetMemo()
            }
        })
    }

    const handleEditMemo = async (item) => {
        setEditName(item.name)
        setValue(item.content)
    }

    React.useEffect(() => {
        initMemoDir()
        getSetMemo()
    }, [])


    return <div id="app">
        <Row gutter={20}>
            <Col span={22}>
                <MDEditor editMode="auto" value={value} onChangeText={setValue} />
            </Col>
            <Col span={2} style={{ height: '300px' }}>
                <Button onClick={saveMessage} type='primary' size='large' style={{ position: 'absolute', bottom: 10 }}>保存</Button>
            </Col>
        </Row>
        <h2 style={{ margin: '30px auto', width:'88%',  }}>
            记录列表
            <hr />
        </h2>
        
        {
            list.map(item => {
                return <Card style={{ margin: '20px auto', width:'90%',  }} bordered={true} hoverable={true} actions={[<Button type='text' size='mini' onClick={handleEditMemo.bind(this, item)}>修改</Button>, <Button type='text' size='mini' onClick={handleDeleteMemo.bind(this, item)}>删除</Button>, item.time, ]}>
                    <MDViewer value={item.content} />
                </Card>
            })
        }
    </div>

}
