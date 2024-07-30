class WebSocketManager {
    private static instance: WebSocketManager;
    private ws: WebSocket | null = null;
    private url: string;
    private onMessageCallback: ((data: string) => void) | null = null;
    private reconnectTimeout: number | null = null;

    private constructor(url: string) {
        this.url = url;
        this.connect();
    }

    public static getInstance(url: string): WebSocketManager {
        if (!WebSocketManager.instance) {
            WebSocketManager.instance = new WebSocketManager(url);
        }
        return WebSocketManager.instance;
    }

    public connect(): void {
        if (!this.ws || this.ws.readyState === WebSocket.CLOSED) {
            this.ws = new WebSocket(this.url);

            this.ws.onopen = () => {
                console.log('WebSocket connection opened');
                if (this.reconnectTimeout) {
                    clearTimeout(this.reconnectTimeout);
                    this.reconnectTimeout = null;
                }
            };

            this.ws.onmessage = (event: MessageEvent) => {
                console.log('WebSocket message received:', event.data);
                if (this.onMessageCallback) {
                    this.onMessageCallback(event.data);
                }
            };

            this.ws.onclose = (event: CloseEvent) => {
                console.log('WebSocket connection closed', event);
                this.reconnect();
            };

            this.ws.onerror = (error: Event) => {
                console.error('WebSocket error:', error);
            };
        }
    }

    private reconnect(): void {
        if (!this.reconnectTimeout) {
            console.log('Attempting to reconnect WebSocket...');
            this.reconnectTimeout = window.setTimeout(() => this.connect(), 5000); // Reconnect after 5 seconds
        }
    }

    public setOnMessage(callback: (data: string) => void): void {
        this.onMessageCallback = callback;
    }
}

export default WebSocketManager.getInstance('ws://localhost:8080/ws/admin');
