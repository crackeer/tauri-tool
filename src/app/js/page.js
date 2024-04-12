'use client'
import React from 'react'
import { Button, Input, Message } from '@arco-design/web-react';
import { IconPlayArrow } from "@arco-design/web-react/icon";
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { dracula } from '@uiw/codemirror-theme-dracula';
import invoke from '@/util/invoke';
const codeTmpl = `for(var i = 1;i< 10000;i++) {
    console.log(i)
}`
export default function App() {
    const [code, setCode] = React.useState(codeTmpl)
    const [output, setOutput] = React.useState("")
    const [running, setRunning] = React.useState(false)
    const runJsCode = async () => {
        setOutput([])
        setRunning(true)
        let result = await invoke.runJsCode(code)
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
    return <div>
        <CodeMirror
            value={code} height="350px" extensions={[javascript({ jsx: true })]}
            onChange={onChange}
            theme={dracula}
        />

        <div style={{ margin: '10px 0' }}>
            <Button onClick={runJsCode} icon={<IconPlayArrow />} loading={running} type='primary'>run code</Button>
        </div>
        <Input.TextArea value={output} rows={10} placeholder="js output"></Input.TextArea>
    </div>
}
