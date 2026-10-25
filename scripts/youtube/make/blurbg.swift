// Usage: swift blurbg.swift <input> <output.jpg> [radius]
// Keeps the person sharp (macOS Vision foreground mask) and blurs everything behind.
import AppKit
import CoreImage
import Vision

let a = CommandLine.arguments
let src = CIImage(contentsOf: URL(fileURLWithPath: a[1]))!
let radius = a.count > 3 ? Double(a[3])! : 28
let ctx = CIContext()
let cg = ctx.createCGImage(src, from: src.extent)!

let req = VNGenerateForegroundInstanceMaskRequest()
let handler = VNImageRequestHandler(cgImage: cg)
try handler.perform([req])
guard let obs = req.results?.first else { print("no person found"); exit(1) }
let maskBuf = try obs.generateScaledMaskForImage(forInstances: obs.allInstances, from: handler)
// Soften the mask edge a little so hair does not look cut.
let mask = CIImage(cvPixelBuffer: maskBuf)
  .applyingGaussianBlur(sigma: 2).cropped(to: src.extent)

let blurred = src.clampedToExtent().applyingGaussianBlur(sigma: radius).cropped(to: src.extent)
let out = src.applyingFilter("CIBlendWithMask", parameters: [
  kCIInputBackgroundImageKey: blurred,
  kCIInputMaskImageKey: mask,
])
let rep = NSBitmapImageRep(cgImage: ctx.createCGImage(out, from: src.extent)!)
try rep.representation(using: .jpeg, properties: [.compressionFactor: 0.92])!.write(to: URL(fileURLWithPath: a[2]))
print("ok")
