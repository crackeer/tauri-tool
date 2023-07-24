use crate::command::base::InvokeResponse;
use serde_json::json;
use ssh2::Session;
use std::io::prelude::*;
use std::net::TcpStream;
use std::path::Path;

fn get_ssh_session(host: &str, private_key_path: &str) -> Result<Session, String> {
    let connection = TcpStream::connect(format!("{}:22", host));
    if let Err(err) = connection {
        return Err(err.to_string());
    }

    let mut session = Session::new().unwrap();
    session.set_tcp_stream(connection.unwrap());
    if let Err(err) = session.handshake() {
        return Err(format!("handshake error:{}", err.to_string()));
    }
    if let Err(err) = session.auth_methods(&"root") {
        return Err(format!("auth root error :{}", err.to_string()));
    }

    if let Err(err) = session.userauth_pubkey_file("root", None, Path::new(&private_key_path), None)
    {
        return Err(format!("userauth_pubkey_file error :{}", err.to_string()));
    }

    if !session.authenticated() {
        return Err(String::from("authenticated wrong"));
    }

    Ok(session)
}

#[tauri::command]
pub async fn get_local_config(host: String, private_key_path: String) -> String {
    let session = get_ssh_session(&host, &private_key_path);
    if let Err(err) = session {
        print!("{}", err.to_string());
        return String::from(err.to_string());
    }
    let sess = session.unwrap();
    let mut channel = sess.channel_session().unwrap();
    //channel.exec("docker exec business_mysql3_1 /bin/bash -c \"mysql -uroot -pz_php_root vrapi -e 'select value from strategy where name=\"vrfile\";'\"").unwrap();
    //channel.exec("docker exec business_mysql3_1 /bin/bash -c \"echo 565;\"").unwrap();
    channel.exec("docker exec business_mysql3_1 /bin/bash -c \"mysql -uroot -pz_php_root vrapi -e 'select value from strategy where name=\\\"vrfile\\\" and \\`key\\` = \\\"local_config\\\";'\"").unwrap();
    let mut s = String::new();
    channel.read_to_string(&mut s);
    s
}

#[tauri::command]
pub async fn update_outer_host(
    host: String,
    private_key_path: String,
    old_host: String,
    new_host: String,
) -> String {
    let session = get_ssh_session(&host, &private_key_path);
    if let Err(err) = session {
        return String::from(err.to_string());
    }
    let sess = session.unwrap();
    let mut channel = sess.channel_session().unwrap();
    //channel.exec("docker exec business_mysql3_1 /bin/bash -c \"mysql -uroot -pz_php_root vrapi -e 'select value from strategy where name=\"vrfile\";'\"").unwrap();
    //channel.exec("docker exec business_mysql3_1 /bin/bash -c \"echo 565;\"").unwrap();
    let mut sql: Vec<String> = Vec::new();
    sql.push(format!("update strategy set value=replace(value, \\\"{}\\\", \\\"{}\\\") where name=\\\"vrfile\\\";", &old_host, &new_host));
    sql.push(format!(
        "update tag set target_url=replace(target_url, \\\"{}\\\", \\\"{}\\\");",
        &old_host, &new_host
    ));
    sql.push(format!(
        "update tag set media_data=replace(media_data, \\\"{}\\\", \\\"{}\\\");",
        &old_host, &new_host
    ));
    sql.push(format!(
        "update observer_picture set picture_url=replace(picture_url, \\\"{}\\\", \\\"{}\\\");",
        &old_host, &new_host
    ));

    let exec_cmd = format!(
        "docker exec business_mysql3_1 /bin/bash -c \"mysql -uroot -pz_php_root vrapi -e '{}'\"",
        sql.join("").as_str()
    );
    println!("{}", exec_cmd);
    channel.exec(&exec_cmd).unwrap();
    let mut result = String::new();
    _ = channel.read_to_string(&mut result);
    result
}

#[tauri::command]
pub async fn list_files(host: String, private_key_path: String, path: String) -> InvokeResponse {
    let session = get_ssh_session(&host, &private_key_path);
    if let Err(err) = session {
        return InvokeResponse {
            success: false,
            message: err.to_string(),
            data: json!(null),
        };
    }
    let sess = session.unwrap();
    let mut channel = sess.channel_session().unwrap();
    channel.exec(&format!("ls -l {}", path)).unwrap();
    let mut result = String::new();
    _ = channel.read_to_string(&mut result);
    InvokeResponse {
        success: true,
        message: "".to_string(),
        data: json!(result),
    }
}
