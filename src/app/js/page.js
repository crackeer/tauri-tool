'use client'
import React from 'react'
import { Button, Input, Message, Select } from '@arco-design/web-react';
import { IconPlayArrow } from "@arco-design/web-react/icon";
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { dracula } from '@uiw/codemirror-theme-dracula';
import invoke from '@/util/invoke';
import cache from '@/util/cache';
const codeTmpl = `for(var i = 1;i< 10000;i++) {
    console.log(i)
}`
const Option = Select.Option;

const presetNodePath = [
    'node',
    '/usr/local/bin/node',
    '/usr/local/node',
]

const setInputNodePath = async (value) => {
    return await cache.set("run_js_code.node_input_path", value)
}

const getInputNodePath = async () => {
    return await cache.get("run_js_code.node_input_path")
}

const setSelectNodePath = async (value) => {
    return await cache.set("run_js_code.select_node_path", value)
}

const getSelectNodePath = async () => {
    return await cache.get("run_js_code.select_node_path")
}

export default function App() {
    const [code, setCode] = React.useState(codeTmpl)
    const [output, setOutput] = React.useState("")
    const [nodePath, setNodePath] = React.useState(presetNodePath[0])
    const [nodePaths, setNodePaths] = React.useState(presetNodePath)
    const [running, setRunning] = React.useState(false)
    React.useEffect(() => {
        var initSet = async () => {
            let inputNodePath = await getInputNodePath()
            if (inputNodePath != null) {
                setNodePaths([...presetNodePath, inputNodePath])
            }
            let selectNodePath = await getSelectNodePath()
            if (selectNodePath != null) {
                setNodePath(selectNodePath)
            }
        }
        initSet()
    }, [])
    const runJsCode = async () => {
        setOutput([])
        setRunning(true)
        let result = await invoke.runJsCode(nodePath, code)
        setRunning(false)
        if (!result.success) {
            Message.error(result.message)
            return
        }
        setOutput(result.data.output)
    }
    const onChange = React.useCallback((val, viewUpdate) => {
        setCode(val);
    }, []);

    const changeNodePath = (value) => {
        for (var i in presetNodePath) {
            if (value !== presetNodePath[i]) {
                setInputNodePath(value)
            }
        }
        setSelectNodePath(value)
        setNodePath(value)
    }
    return <div>
        <CodeMirror
            value={code} height="350px" extensions={[javascript({ jsx: true })]}
            onChange={onChange}
            theme={dracula}
        />

        <div style={{ margin: '10px 0' }}>
            <Button onClick={runJsCode} icon={<IconPlayArrow />} loading={running} type='primary'>run code</Button>
            <Select
                placeholder='Please select node path'
                style={{ width: 345, marginBottom: 20, float: 'right' }}
                allowCreate
                onChange={changeNodePath}
                value={nodePath}
            >
                {
                    nodePaths.map(item => {
                        return <Option key={item} value={item}>{item}</Option>
                    })
                }

            </Select>
        </div>
        <Input.TextArea value={output} rows={10} placeholder="js output"></Input.TextArea>
    </div>
}
