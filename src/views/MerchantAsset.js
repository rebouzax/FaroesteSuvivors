import merchantUrl from "../assets/models/merchant.glb?url";

let request;
export function loadMerchantAsset() {
  request ??= import("three/addons/loaders/GLTFLoader.js")
    .then(({ GLTFLoader }) => new GLTFLoader().loadAsync(merchantUrl))
    .catch(error => { request = null; throw error; });
  return request;
}
