
use ssh2::Session;
use std::fmt::format;
use std::io::prelude::*;
use std::net::TcpStream;


#[tauri::command]
pub async fn get_local_config(host: String, private_key : String) -> String {
   let tcp = TcpStream::connect(format!("{}:22", host)).unwrap();
   let mut sess = Session::new().unwrap();
   sess.set_tcp_stream(tcp);
   sess.handshake().unwrap();

   sess.userauth_pubkey_memory("root", Some(""), &private_key, None)
       .unwrap();

   assert!(sess.authenticated());
   let mut channel = sess.channel_session().unwrap();
   //channel.exec("docker exec business_mysql3_1 /bin/bash -c \"mysql -uroot -pz_php_root vrapi -e 'select value from strategy where name=\"vrfile\";'\"").unwrap();
   //channel.exec("docker exec business_mysql3_1 /bin/bash -c \"echo 565;\"").unwrap();
   channel.exec("docker exec business_mysql3_1 /bin/bash -c \"mysql -uroot -pz_php_root vrapi -e 'select value from strategy where name=\\\"vrfile\\\" and \\`key\\` = \\\"local_config\\\";'\"").unwrap();
   let mut s = String::new();
   channel.read_to_string(&mut s);
   s
}

#[tauri::command]
pub async fn update_outer_host( host: String, private_key : String, old_host: String, new_host : String) -> String {
    let tcp = TcpStream::connect(format!("{}:22", host)).unwrap();
    let mut sess = Session::new().unwrap();
    sess.set_tcp_stream(tcp);
    sess.handshake().unwrap();
 
    sess.userauth_pubkey_memory("root", Some(""), &private_key, None)
        .unwrap();
 
    assert!(sess.authenticated());
    let mut channel = sess.channel_session().unwrap();
    //channel.exec("docker exec business_mysql3_1 /bin/bash -c \"mysql -uroot -pz_php_root vrapi -e 'select value from strategy where name=\"vrfile\";'\"").unwrap();
    //channel.exec("docker exec business_mysql3_1 /bin/bash -c \"echo 565;\"").unwrap();
    let mut sql : Vec<String> = Vec::new();
    sql.push(format!("update strategy set value=replace(value, \\\"{}\\\", \\\"{}\\\") where name=\\\"vrfile\\\";", &old_host, &new_host));
    sql.push(format!("update tag set target_url=replace(target_url, \\\"{}\\\", \\\"{}\\\");", &old_host, &new_host));
    sql.push(format!("update tag set media_data=replace(media_data, \\\"{}\\\", \\\"{}\\\");", &old_host, &new_host));
    sql.push(format!("update observer_picture set picture_url=replace(picture_url, \\\"{}\\\", \\\"{}\\\");", &old_host, &new_host));
    
    let exec_cmd = format!("docker exec business_mysql3_1 /bin/bash -c \"mysql -uroot -pz_php_root vrapi -e '{}'\"", sql.join("").as_str());
    println!("{}", exec_cmd);
    channel.exec(&exec_cmd).unwrap();
    let mut result = String::new();
    channel.read_to_string(&mut result);
    result
 }
