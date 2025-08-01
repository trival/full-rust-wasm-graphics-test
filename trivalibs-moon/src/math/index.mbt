/// Math library index - exports convenience functions

// Re-export common math functions from common.mbt
pub fn radians(degrees : Double) -> Double {
  radians_scalar(degrees)
}

pub fn degrees(radians : Double) -> Double {
  degrees_scalar(radians)
}