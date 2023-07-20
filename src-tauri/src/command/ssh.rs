
use ssh2::Session;
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
