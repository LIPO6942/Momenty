const token = process.env.HUGGINGFACE_API_TOKEN;
const base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

async function test() {
    const res = await fetch('https://router.huggingface.co/hf-inference/models/timbrooks/instruct-pix2pix', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            inputs: base64,
            parameters: { prompt: 'turn it into a painting' }
        })
    });
    console.log(await res.text());
}
test();
