export const MAX_IMAGE_EDGE=4096;
export const MAX_IMAGE_PIXELS=12_000_000;

export function checkImageDimensions(width,height,label='Image'){
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1)throw Error(`${label}: could not read pixel dimensions.`);
 if(width>MAX_IMAGE_EDGE||height>MAX_IMAGE_EDGE||width*height>MAX_IMAGE_PIXELS)throw Error(`${label} is ${width.toLocaleString()} × ${height.toLocaleString()} pixels. Resize it to no more than ${MAX_IMAGE_EDGE.toLocaleString()} pixels on either edge and ${MAX_IMAGE_PIXELS/1_000_000} megapixels, then upload it again.`);
 return {width,height};
}

const isSof=marker=>[0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker);
function jpegSize(bytes){
 if(bytes[0]!==0xff||bytes[1]!==0xd8)return null;
 const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);let at=2;
 while(at+4<bytes.length){if(bytes[at++]!==0xff)continue;while(bytes[at]===0xff)at++;const marker=bytes[at++];if(marker===0xda||marker===0xd9)break;if(marker===0x00||marker===0xd8||marker>=0xd0&&marker<=0xd7||marker===0x01)continue;if(at+2>bytes.length)break;const length=view.getUint16(at,false);if(length<2)break;if(isSof(marker)){if(at+7>bytes.length||length<7)break;return {height:view.getUint16(at+3,false),width:view.getUint16(at+5,false)};}if(at+length>bytes.length)break;at+=length;}
 return null;
}

export async function inspectImageFile(file,{maxBytes,label='Image'}={}){
 if(!file||!['image/png','image/jpeg'].includes(file.type))throw Error(`${label}: choose a PNG or JPEG image.`);
 if(!Number.isFinite(file.size)||file.size<1)throw Error(`${label}: the file is empty.`);
 if(maxBytes&&file.size>maxBytes)throw Error(`${label}: the file must be ${Math.round(maxBytes/1048576)} MB or smaller.`);
 const header=new Uint8Array(await file.slice(0,Math.min(file.size,1024*1024)).arrayBuffer());let size,type;
 if(header.length>=24&&header[0]===0x89&&header[1]===0x50&&header[2]===0x4e&&header[3]===0x47&&header[12]===0x49&&header[13]===0x48&&header[14]===0x44&&header[15]===0x52){const view=new DataView(header.buffer,header.byteOffset,header.byteLength);size={width:view.getUint32(16,false),height:view.getUint32(20,false)};type='image/png';}
 else{size=jpegSize(header);if(size)type='image/jpeg';}
 if(!size||type!==file.type)throw Error(`${label}: the image file could not be read. Re-export it as a standard PNG or JPEG and try again.`);
 return checkImageDimensions(size.width,size.height,label);
}
