'use client'
import React, { useEffect, useState } from 'react';
import { Divider } from '@arco-design/web-react';
import menu from "../config/menu"

export default function Template({
    children
}) {
    const [name, setName] = useState('')
    useEffect(() => {
        for(let i = 0; i < menu.length; i++) {
            if(menu[i].key === window.location.pathname) {
                setName(menu[i].title)
            }
        }
    }, [])

    if (name.length > 0)  {
        return <>
            <h3>{name}</h3>
            <Divider></Divider>
            {children}
        </>
    }
    return null;
}