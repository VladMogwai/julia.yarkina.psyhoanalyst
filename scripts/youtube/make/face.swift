// Usage: swift face.swift <image>...  → prints "<file> <imgW> <imgH> <faceX> <faceY> <faceW> <faceH>" (pixels, top-left origin, largest face)
// The image is turned upright first (phone photos are often stored sideways with an EXIF orientation flag).
import CoreImage
import Vision

for path in CommandLine.arguments.dropFirst() {
  guard let img = CIImage(contentsOf: URL(fileURLWithPath: path), options: [.applyOrientationProperty: true]) else {
    print(path, 0, 0, "none"); continue
  }
  let (w, h) = (Double(img.extent.width), Double(img.extent.height))
  let req = VNDetectFaceRectanglesRequest()
  try VNImageRequestHandler(ciImage: img).perform([req])
  guard let f = req.results?.max(by: { $0.boundingBox.width < $1.boundingBox.width })?.boundingBox else {
    print(path, Int(w), Int(h), "none"); continue
  }
  print(path, Int(w), Int(h), Int(f.minX * w), Int((1 - f.maxY) * h), Int(f.width * w), Int(f.height * h))
}
