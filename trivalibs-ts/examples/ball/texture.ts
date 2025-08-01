// Generate a simple checkerboard texture
export function generateCheckerboardTexture(width: number, height: number): Uint8Array {
    const data = new Uint8Array(width * height * 4); // RGBA
    const checkSize = 32;
    
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const index = (y * width + x) * 4;
            
            const checkX = Math.floor(x / checkSize);
            const checkY = Math.floor(y / checkSize);
            const isLight = (checkX + checkY) % 2 === 0;
            
            if (isLight) {
                // Light blue/white
                data[index] = 200;     // R
                data[index + 1] = 220; // G
                data[index + 2] = 255; // B
            } else {
                // Dark blue
                data[index] = 50;      // R
                data[index + 1] = 100; // G
                data[index + 2] = 200; // B
            }
            data[index + 3] = 255; // A
        }
    }
    
    return data;
}