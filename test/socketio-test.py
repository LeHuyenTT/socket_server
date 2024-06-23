from locust import HttpUser, between, task
import socketio
import random
import time

class SocketIOUser(HttpUser):
    wait_time = between(1, 5)

    def on_start(self):
        self.sio = socketio.Client()
        self.sio.on('connect', self.on_connect)
        self.sio.on('disconnect', self.on_disconnect)
        
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
            start_time = time.time()
            # Send 'noti:status' event immediately after connecting
            class_id = 'MATH101'  # Replace with your class_id or generate dynamically
            type = random.choice(['joinClass', 'leaveClass'])   # Replace with the type of notification you want to send
            data = f'{self.user_id}_{class_id}_{type}'
            self.sio.emit('noti:status', data)
            self.sio.on('clientStatus', lambda data: self.on_message(data, start_time))
        else:
            print("Socket chưa kết nối")
    def on_message(self, data, start_time):
        end_time = time.time()
        response_time = (end_time - start_time) * 1000  # milliseconds
        print(f"Response time for client {data.get('clientId')}: {response_time:.2f} ms")
        self.environment.events.request.fire(
            request_type="WSR", 

            
            name="clientStatus",
            response_time=response_time,
            response_length=len(str(data)),
            exception=None,
            context=self.context(),
        )
    
    # @task
    # def send_message(self):
    #     if self.sio.connected:
    #         user_id = random.randint(20520000, 20520999)
    #         self.sio.emit('notifications', f'{user_id}_{user_id}:notify')
    #         start_time = time.time()
    #         self.sio.on('response', lambda data: self.on_message(data, start_time))
    #     else:
    #         print("Socket is not connected")

    # def on_message(self, data, start_time):
    #     end_time = time.time()
    #     response_time = (end_time - start_time) * 1000  # milliseconds
    #     print(f'Response time: {response_time:.2f}')
    #     self.environment.events.request.fire(
    #         request_type="WSR",  # WebSocket Response
    #         name="response",
    #         response_time=response_time,
    #         response_length=len(data),
    #         exception=None,
    #         context=self.context(),
    #     )