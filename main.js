const t = Date.now();
let loaded, asset = false;
let overlays = [];

$(function() {
  $('#find_button').click(loadTokenAsset);
  $('.overlay_select').click(toggleOverlay);
});

const loadTokenAsset = function() {
  $('.error').hide();
  const options = { method: 'GET', headers: { accept: '*/*', xApiKey: 'eee8eadf-046b-5f38-ba21-145d40ca278e' } };
  var address = '0xBEbaa24108d6a03C7331464270b95278bBBE6Ff7';
  var token_id = $('#token_id').val();
  console.log(token_id)
  url = `https://api-apechain.reservoir.tools/tokens/v7?tokens=${address}:${token_id}`;
  console.log(url);
  fetch(url)
    .then(response => response.json())
    .then(response => setMainAsset(response['tokens'][0].token.image))
    //.then(response => setMainAsset(response['tokens'][0].token.image))
    .catch(err => raiseError(err));

  $('#download_button').click(function() {
    if (loaded) {
      canvas = document.getElementById('pfp');
      downloadCanvas(canvas);
    }
  });
}

const setMainAsset = function(url, overlay=null) {
  console.log(url);
  asset = url.replace('width=512', 'width=2000');
  console.log(url)
  loadImage();
  loaded = true;
  $('.pfp').show();
}
const toggleOverlay = function() {
  let img = $(this).attr('id')
  if(overlays.indexOf(img) < 0) {
    addOverlay(img);
    console.log(img);
    $(this).addClass('overlay_active');
  } else {
    removeOverlay(img);
    $(this).removeClass('overlay_active');
  }
}

const addOverlay = function(img) {
  overlays.push(img);
  loadImage();
}

const removeOverlay = function(img) {
  let idx = overlays.indexOf(img);
  overlays.splice(idx, 1);
  loadImage();
}

const raiseError = function(err) {
  console.log(err);
  $('.error').show();
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext("2d");
  ctx.reset();
}

const loadImage = async function() {
  canvas = await generatePfpImage();
  const dataURL = canvas.toDataURL('image/png');
  const pfp = document.getElementById('pfp');
  const ctx = pfp.getContext('2d');
  pfp.width = 2000;
  pfp.height = 2000;
  img = newImage(dataURL);
  await preload(dataURL)
  .then(function() {
    ctx.drawImage(
      img, 0, 0, 2000, 2000
    );
  });
}

const preload = function(src) {
  return new Promise(function(resolve, reject) {
    const img = new Image();
    img.onload = function() {
      resolve(src);
    }
    img.onerror = function() {
      console.error('Failed to load image: ' + src);
    }
    img.src = src;
  });
}

const generatePfpImage = async function() {
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');

  var images = [newImage(asset)];

  overlays.forEach(ol => {
    img = './images/' + ol + '.png?t='+t;
    images.push(newImage(img));
  })

  canvas.width = 2000;
  canvas.height = 2000;

  return Promise.all(images.map(img => new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = () => reject(new Error('Failed to load image: ' + img.src));
  }))).then(() => {
    images.forEach(img => {
      ctx.drawImage(
        img, 0, 0, 2000, 2000
      );
    });
    return canvas;
  }).catch(error => {
    console.error(error);
  });
}

const newImage = function(f) {
  const img = new Image();
  img.crossOrigin="anonymous";
  img.src = f;
  return img;
}

const rgbToHex = function(r, g, b) {
    if (r > 255 || g > 255 || b > 255)
        throw "Invalid color component";
    return ((r << 16) | (g << 8) | b).toString(16);
}

const downloadCanvas = function(canvas) {
  const dataURL = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.href = dataURL;
  link.download = 'image.png';
  link.click();
}

const editImage = async function(imageFile, prompt) {
    const apiUrl = 'https://api.openai.com/v1/images';
    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              prompt: 'Manipulate this image',
              image: imageFile.split(',')[1],
              n: 1,
              size: '1024x1024'
            })
        });

        if (!response.ok) {
            throw new Error('API request failed');
        }

        console.log(response); // Handle the response as needed

        // Optionally, display the generated images
        result.data.forEach(image => {
            const imgElement = new Image();
            imgElement.src = image.url; // Assuming the API returns URLs of the images
            document.body.appendChild(imgElement);
        });

    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while editing the image.');
    }
}

function dataURItoBlob(dataURI) {
  // convert base64/URLEncoded data component to raw binary data held in a string
  var byteString;
  if (dataURI.split(',')[0].indexOf('base64') >= 0)
    byteString = atob(dataURI.split(',')[1]);
  else
    byteString = unescape(dataURI.split(',')[1]);

  // separate out the mime component
  var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

  // write the bytes of the string to a typed array
  var ia = new Uint8Array(byteString.length);
  for (var i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ia], {type:mimeString});
}
