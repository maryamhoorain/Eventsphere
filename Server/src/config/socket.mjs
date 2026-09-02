let io;

export const setSocketIO = (socketIO) => {
    io = socketIO;
};

export const getSocketIO = () => {
    return io;
};