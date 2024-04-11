'use client'
import React, { useState, useEffect } from 'react';
import '@/styles/globals.css'
import "@arco-design/web-react/dist/css/arco.css";
import { Layout, Menu } from '@arco-design/web-react';
import menu from "@/config/menu"
import invoke from "@/util/invoke"
const Sider = Layout.Sider;
const MenuItem = Menu.Item;

export default function RootLayout({
    children
}) {

    const [activeMenuKey, setActiveMenuKey] = useState([])
    useEffect(() => {
        setActiveMenuKey([window.location.pathname])
        for (let i = 0; i < menu.length; i++) {
            if (menu[i].key === window.location.pathname) {
                invoke.setWindowTitle(menu[i].title)
            }
        }
    }, []);
    const clickMenuItem = (item) => {
        window.location.href = item
    }
    return (
        <html lang="en">
            <body>
                <Layout>
                    <Sider
                        theme='light'
                        collapsed={true}
                        style={{
                            overflow: 'auto',
                            height: '100vh',
                            position: 'fixed',
                            left: 0,
                            top: 0,
                            bottom: 0,
                        }}
                    >
                        <Menu onClickMenuItem={clickMenuItem} theme='light' selectedKeys={activeMenuKey}>
                            {
                                menu.map(item => {
                                    return <MenuItem key={item.key} renderitemintooltip={() => item.title}>
                                        {item.icon} {item.title}
                                    </MenuItem>
                                })
                            }
                        </Menu>
                    </Sider>
                    <Layout style={{ marginLeft: '48px', padding: '2px' }}>

                        {children}
                    </Layout>
                </Layout>
            </body>
        </html>
    )
}
