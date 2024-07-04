from locust import HttpUser, between, task
import socketio
import random
import time

class SocketIOUser(HttpUser):
    wait_time = between(0.5, 1)

    def on_start(self):
        self.sio = socketio.Client()
        self.sio.on('connect', self.on_connect)
        self.sio.on('disconnect', self.on_disconnect)
        self.sio.on('clientStatus', self.on_message)  # Đăng ký sự kiện một lần ở đây
        
        # Generate a random user_id within the specified range
        self.user_id = random.randint(20520000, 20520999)
        
        # Create the token in the format "user_id_student"
        self.token = f'{self.user_id}_student'
        
        # Connect to Socket.IO server with query parameters in the URL
        self.sio.connect(f'http://127.0.0.1:4025?token={self.token}', transports=['websocket'])

    def on_connect(self):
        print(f"Connected to the server with user_id: {self.user_id}")

    def on_disconnect(self):
        print(f"Disconnected from the server with user_id: {self.user_id}")

    def on_stop(self):
        self.sio.disconnect()

    @task
    def send_message(self):
        if self.sio.connected:
            self.start_time = time.time()
            # class_id = 'MATH101'
            # type = random.choice(['joinClass', 'leaveClass'])
            # data = f'{self.user_id}_{class_id}_{type}'
            # self.sio.emit('noti:status', data)
        else:
            print("Socket chưa kết nối")

    def on_message(self, data):
        end_time = time.time()
        response_time = (end_time - self.start_time) * 1000  # milliseconds
        print(f"Response time for client {data.get('clientId')}: {response_time:.2f} ms")
        self.environment.events.request.fire(
            request_type="WebSocket", 
            name="clientStatus",
            response_time=response_time,
            response_length=len(str(data)),
            exception=None,
            context=self.context(),
        )
