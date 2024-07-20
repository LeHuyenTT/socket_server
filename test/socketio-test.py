from locust import HttpUser, between, task
import socketio
import random
import time
import os

class SocketIOUser(HttpUser):
    wait_time = between(0.5, 1)

    def on_start(self):
        self.sio = socketio.Client()
        self.sio.on('connect', self.on_connect)
        self.sio.on('disconnect', self.on_disconnect)
        self.sio.on('FileReceive', self.on_message)
        
        # Generate a random user_id
        self.user_id = random.randint(20520000, 20520999)
        self.token = f'{self.user_id}_student'

        # Initialize counters
        self.files_sent = 0
        self.files_received = 0

        # Connect to Socket.IO server
        self.sio.connect(f'http://127.0.0.1:4025?token={self.token}', transports=['websocket'])

    def on_connect(self):
        print(f"Connected to the server with user_id: {self.user_id}")
        #self.send_file()  # Gọi hàm gửi file ngay khi kết nối thành công

    def send_file(self):
        file_path = 'D:/Documents/DO_AN/http_server/doc/ktmt_kltn_phu_luc_3_Huyen_Linh.docx'
        try:
            #file_size = os.path.getsize(file_path)  # Tính kích thước file
            self.start_time = time.time()  # Đặt thời gian bắt đầu ngay trước khi gửi file
            
            with open(file_path, 'rb') as file_stream:
                for chunk in iter(lambda: file_stream.read(1024), b''):
                    print('Sending chunk of data...')
                    #self.sio.emit('fileUpload', chunk)
                
                print('File sent.')
                self.sio.emit('fileUploadComplete')
                self.files_sent += 1
                
        except Exception as e:
            print('Error reading file:', e)

    def on_disconnect(self):
        print(f"Disconnected from the server with user_id: {self.user_id}")

    def on_stop(self):
        self.sio.disconnect()

    @task
    def send_message(self):
        if self.sio.connected:
            self.send_file()
        else:
            print("Socket chưa kết nối")

    def on_message(self, data):
        end_time = time.time()
        response_time = (end_time - self.start_time) * 1000  # milliseconds
        file_size = os.path.getsize('D:/Documents/DO_AN/http_server/doc/ktmt_kltn_phu_luc_3_Huyen_Linh.docx')  # Tính kích thước file gửi lên
        
        print(f"Response time for client {data.get('clientId')}: {response_time:.2f} ms")
        
        self.files_received += 1 
        print(f"Total files sent: {self.files_sent}")
        print(f"Total files received: {self.files_received}")

        self.environment.events.request.fire(
            request_type="WebSocket", 
            name="FileReceive",
            response_time=response_time,
            response_length=file_size,  # Kích thước file gửi lên
            exception=None,
            context=None,
        )
