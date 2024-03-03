import React from 'react';

export default function RootLayout({
    children, // will be a page or nested layout
}) {
    return (
        <html lang="en">
            <body>
                {children}
            </body>
        </html>
    )
}
