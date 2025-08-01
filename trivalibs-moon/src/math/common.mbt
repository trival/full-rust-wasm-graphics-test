/// Common WGSL-compatible math functions

/// Constants
let pi : Double = 3.14159265358979323846

/// Trigonometric functions
pub fn radians_scalar(degrees : Double) -> Double {
  degrees * pi / 180.0
}

pub fn degrees_scalar(radians : Double) -> Double {
  radians * 180.0 / pi
}

/// Common functions matching WGSL built-ins
pub fn sign(x : Double) -> Double {
  if x < 0.0 { 
    -1.0 
  } else if x > 0.0 { 
    1.0 
  } else { 
    0.0 
  }
}

pub fn fract_scalar(x : Double) -> Double {
  x - x.floor()
}

pub fn mod_scalar(x : Double, y : Double) -> Double {
  x - y * (x / y).floor()
}

pub fn mix_scalar(x : Double, y : Double, a : Double) -> Double {
  x * (1.0 - a) + y * a
}

pub fn step_scalar(edge : Double, x : Double) -> Double {
  if x < edge { 0.0 } else { 1.0 }
}

pub fn smoothstep_scalar(edge0 : Double, edge1 : Double, x : Double) -> Double {
  let t = clamp_scalar((x - edge0) / (edge1 - edge0), 0.0, 1.0)
  t * t * (3.0 - 2.0 * t)
}

pub fn clamp_scalar(x : Double, min_val : Double, max_val : Double) -> Double {
  if x < min_val { min_val } else if x > max_val { max_val } else { x }
}

/// Exponential functions
pub fn inversesqrt(x : Double) -> Double {
  1.0 / x.sqrt()
}

/// Tests
test "common math functions" {
  // Test radians/degrees conversion
  assert_true((radians_scalar(180.0) - pi).abs() < 0.0001)
  assert_true((degrees_scalar(pi) - 180.0).abs() < 0.0001)
  
  // Test sign
  assert_eq(sign(-5.0), -1.0)
  assert_eq(sign(5.0), 1.0)
  assert_eq(sign(0.0), 0.0)
  
  // Test fract
  assert_true((fract_scalar(3.7) - 0.7).abs() < 0.0001)
  assert_true((fract_scalar(-1.2) - 0.8).abs() < 0.0001)
  
  // Test mix
  assert_eq(mix_scalar(0.0, 10.0, 0.5), 5.0)
  assert_eq(mix_scalar(2.0, 4.0, 0.25), 2.5)
  
  // Test step
  assert_eq(step_scalar(5.0, 3.0), 0.0)
  assert_eq(step_scalar(5.0, 7.0), 1.0)
  
  // Test smoothstep
  assert_eq(smoothstep_scalar(0.0, 1.0, -1.0), 0.0)
  assert_eq(smoothstep_scalar(0.0, 1.0, 0.5), 0.5)
  assert_eq(smoothstep_scalar(0.0, 1.0, 2.0), 1.0)
  
  // Test clamp
  assert_eq(clamp_scalar(5.0, 0.0, 10.0), 5.0)
  assert_eq(clamp_scalar(-5.0, 0.0, 10.0), 0.0)
  assert_eq(clamp_scalar(15.0, 0.0, 10.0), 10.0)
}