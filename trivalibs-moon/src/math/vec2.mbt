pub struct Vec2 {
  mut x : Double
  mut y : Double
}

/// Constructors matching WGSL
pub fn Vec2::new(x : Double, y : Double) -> Vec2 {
  { x, y }
}

pub fn Vec2::splat(v : Double) -> Vec2 {
  Vec2::new(v, v)
}

pub fn Vec2::zero() -> Vec2 {
  Vec2::new(0.0, 0.0)
}

pub fn Vec2::one() -> Vec2 {
  Vec2::new(1.0, 1.0)
}

/// Clone for safety when needed
pub fn clone(self : Vec2) -> Vec2 {
  Vec2::new(self.x, self.y)
}

/// Mutable operations (return self for chaining)
pub fn add_mut(self : Vec2, other : Vec2) -> Vec2 {
  self.x = self.x + other.x
  self.y = self.y + other.y
  self
}

pub fn sub_mut(self : Vec2, other : Vec2) -> Vec2 {
  self.x = self.x - other.x
  self.y = self.y - other.y
  self
}

pub fn scale(self : Vec2, s : Double) -> Vec2 {
  self.x = self.x * s
  self.y = self.y * s
  self
}

pub fn div_scalar(self : Vec2, s : Double) -> Vec2 {
  self.x = self.x / s
  self.y = self.y / s
  self
}

/// WGSL-compatible methods
pub fn length(self : Vec2) -> Double {
  (self.x * self.x + self.y * self.y).sqrt()
}

pub fn length_squared(self : Vec2) -> Double {
  self.x * self.x + self.y * self.y
}

pub fn normalize(self : Vec2) -> Vec2 {
  let len = self.length()
  if len > 0.0 {
    self.scale(1.0 / len)
  } else {
    self
  }
}

pub fn distance(self : Vec2, other : Vec2) -> Double {
  let dx = self.x - other.x
  let dy = self.y - other.y
  (dx * dx + dy * dy).sqrt()
}

/// Immutable operations for safety
pub fn normalized(self : Vec2) -> Vec2 {
  self.clone().normalize()
}

pub fn add(self : Vec2, other : Vec2) -> Vec2 {
  self.clone().add_mut(other)
}

pub fn sub(self : Vec2, other : Vec2) -> Vec2 {
  self.clone().sub_mut(other)
}

pub fn mul(self : Vec2, scalar : Double) -> Vec2 {
  self.clone().scale(scalar)
}

pub fn div(self : Vec2, scalar : Double) -> Vec2 {
  self.clone().div_scalar(scalar)
}

/// WGSL-style free functions (matching shader built-ins)
pub fn vec2(x : Double, y : Double) -> Vec2 {
  Vec2::new(x, y)
}

pub fn dot(a : Vec2, b : Vec2) -> Double {
  a.x * b.x + a.y * b.y
}

pub fn reflect(i : Vec2, n : Vec2) -> Vec2 {
  // i - 2.0 * dot(n, i) * n
  i.clone().sub_mut(n.clone().scale(2.0 * dot(n, i)))
}

pub fn mix(a : Vec2, b : Vec2, t : Double) -> Vec2 {
  // WGSL mix function: a * (1 - t) + b * t
  Vec2::new(
    a.x * (1.0 - t) + b.x * t,
    a.y * (1.0 - t) + b.y * t
  )
}

pub fn clamp(v : Vec2, min : Vec2, max : Vec2) -> Vec2 {
  Vec2::new(
    clamp_scalar(v.x, min.x, max.x),
    clamp_scalar(v.y, min.y, max.y)
  )
}

pub fn step(edge : Vec2, v : Vec2) -> Vec2 {
  Vec2::new(
    if v.x < edge.x { 0.0 } else { 1.0 },
    if v.y < edge.y { 0.0 } else { 1.0 }
  )
}

pub fn smoothstep(edge0 : Vec2, edge1 : Vec2, v : Vec2) -> Vec2 {
  let x = clamp(
    v.clone().sub_mut(edge0.clone()).div_components(edge1.clone().sub_mut(edge0.clone())),
    Vec2::zero(),
    Vec2::one()
  ).x
  let y = clamp(
    v.clone().sub_mut(edge0.clone()).div_components(edge1.clone().sub_mut(edge0.clone())),
    Vec2::zero(),
    Vec2::one()
  ).y
  Vec2::new(
    x * x * (3.0 - 2.0 * x),
    y * y * (3.0 - 2.0 * y)
  )
}

/// Component-wise operations
pub fn div_components(self : Vec2, other : Vec2) -> Vec2 {
  self.x = self.x / other.x
  self.y = self.y / other.y
  self
}

pub fn abs(v : Vec2) -> Vec2 {
  Vec2::new(v.x.abs(), v.y.abs())
}

pub fn floor(v : Vec2) -> Vec2 {
  Vec2::new(v.x.floor(), v.y.floor())
}

pub fn ceil(v : Vec2) -> Vec2 {
  Vec2::new(v.x.ceil(), v.y.ceil())
}

pub fn fract(v : Vec2) -> Vec2 {
  Vec2::new(v.x - v.x.floor(), v.y - v.y.floor())
}

pub fn sin(v : Vec2) -> Vec2 {
  Vec2::new(v.x.sin(), v.y.sin())
}

pub fn cos(v : Vec2) -> Vec2 {
  Vec2::new(v.x.cos(), v.y.cos())
}

/// Operator overloading for convenience
pub fn op_add(self : Vec2, other : Vec2) -> Vec2 {
  self.add(other)
}

pub fn op_sub(self : Vec2, other : Vec2) -> Vec2 {
  self.sub(other)
}

/// String representation for debugging
pub fn to_string(self : Vec2) -> String {
  "Vec2(" + self.x.to_string() + ", " + self.y.to_string() + ")"
}

/// Tests
test "Vec2 constructors" {
  let v1 = Vec2::new(1.0, 2.0)
  assert_eq(v1.x, 1.0)
  assert_eq(v1.y, 2.0)
  
  let v2 = Vec2::splat(3.0)
  assert_eq(v2.x, 3.0)
  assert_eq(v2.y, 3.0)
  
  let v3 = Vec2::zero()
  assert_eq(v3.x, 0.0)
  assert_eq(v3.y, 0.0)
  
  let v4 = Vec2::one()
  assert_eq(v4.x, 1.0)
  assert_eq(v4.y, 1.0)
}

test "Vec2 basic operations" {
  let v1 = Vec2::new(1.0, 2.0)
  let v2 = Vec2::new(3.0, 4.0)
  
  // Test add
  let sum = v1.add(v2)
  assert_eq(sum.x, 4.0)
  assert_eq(sum.y, 6.0)
  
  // Test sub
  let diff = v2.sub(v1)
  assert_eq(diff.x, 2.0)
  assert_eq(diff.y, 2.0)
  
  // Test scale
  let scaled = v1.mul(2.0)
  assert_eq(scaled.x, 2.0)
  assert_eq(scaled.y, 4.0)
  
  // Test div
  let divided = v2.div(2.0)
  assert_eq(divided.x, 1.5)
  assert_eq(divided.y, 2.0)
}

test "Vec2 length and normalize" {
  let v = Vec2::new(3.0, 4.0)
  assert_eq(v.length(), 5.0)
  assert_eq(v.length_squared(), 25.0)
  
  let normalized = v.normalized()
  assert_eq(normalized.x, 0.6)
  assert_eq(normalized.y, 0.8)
  assert_true((normalized.length() - 1.0).abs() < 0.0001)
}

test "Vec2 dot product" {
  let v1 = Vec2::new(1.0, 2.0)
  let v2 = Vec2::new(3.0, 4.0)
  assert_eq(dot(v1, v2), 11.0)
}

test "Vec2 distance" {
  let v1 = Vec2::new(0.0, 0.0)
  let v2 = Vec2::new(3.0, 4.0)
  assert_eq(v1.distance(v2), 5.0)
}

test "Vec2 operators" {
  let v1 = Vec2::new(1.0, 2.0)
  let v2 = Vec2::new(3.0, 4.0)
  
  let sum = v1 + v2
  assert_eq(sum.x, 4.0)
  assert_eq(sum.y, 6.0)
  
  let diff = v2 - v1
  assert_eq(diff.x, 2.0)
  assert_eq(diff.y, 2.0)
  
  let scaled = v1.mul(2.0)
  assert_eq(scaled.x, 2.0)
  assert_eq(scaled.y, 4.0)
  
  let divided = v2.div(2.0)
  assert_eq(divided.x, 1.5)
  assert_eq(divided.y, 2.0)
}

test "Vec2 WGSL functions" {
  let v = Vec2::new(0.3, 0.7)
  let edge0 = Vec2::zero()
  let edge1 = Vec2::one()
  
  // Test clamp
  let clamped = clamp(Vec2::new(-0.5, 1.5), edge0, edge1)
  assert_eq(clamped.x, 0.0)
  assert_eq(clamped.y, 1.0)
  
  // Test mix
  let mixed = mix(edge0, edge1, 0.5)
  assert_eq(mixed.x, 0.5)
  assert_eq(mixed.y, 0.5)
  
  // Test reflect
  let i = Vec2::new(1.0, -1.0)
  let n = Vec2::new(0.0, 1.0)
  let reflected = reflect(i, n)
  assert_eq(reflected.x, 1.0)
  assert_eq(reflected.y, 1.0)
}