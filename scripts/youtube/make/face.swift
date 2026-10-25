// Usage: swift face.swift <image>...  → prints "<file> <imgW> <imgH> <faceX> <faceY> <faceW> <faceH>" (pixels, top-left origin, largest face)
import AppKit
import Vision

for path in CommandLine.arguments.dropFirst() {
  let img = NSImage(contentsOfFile: path)!
  var r = CGRect(origin: .zero, size: img.size)
  let cg = img.cgImage(forProposedRect: &r, context: nil, hints: nil)!
  let (w, h) = (Double(cg.width), Double(cg.height))
  let req = VNDetectFaceRectanglesRequest()
  try VNImageRequestHandler(cgImage: cg).perform([req])
  guard let f = req.results?.max(by: { $0.boundingBox.width < $1.boundingBox.width })?.boundingBox else {
    print(path, Int(w), Int(h), "none"); continue
  }
  print(path, Int(w), Int(h), Int(f.minX * w), Int((1 - f.maxY) * h), Int(f.width * w), Int(f.height * h))
}
