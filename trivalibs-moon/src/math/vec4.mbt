pub struct Vec4 {
  mut x : Double
  mut y : Double
  mut z : Double
  mut w : Double
}

/// Constructors matching WGSL
pub fn Vec4::new(x : Double, y : Double, z : Double, w : Double) -> Vec4 {
  { x, y, z, w }
}

pub fn Vec4::splat(v : Double) -> Vec4 {
  Vec4::new(v, v, v, v)
}

pub fn Vec4::zero() -> Vec4 {
  Vec4::new(0.0, 0.0, 0.0, 0.0)
}

pub fn Vec4::one() -> Vec4 {
  Vec4::new(1.0, 1.0, 1.0, 1.0)
}

/// Clone for safety when needed
pub fn clone(self : Vec4) -> Vec4 {
  Vec4::new(self.x, self.y, self.z, self.w)
}

/// Mutable operations (return self for chaining)
pub fn add_mut(self : Vec4, other : Vec4) -> Vec4 {
  self.x = self.x + other.x
  self.y = self.y + other.y
  self.z = self.z + other.z
  self.w = self.w + other.w
  self
}

pub fn sub_mut(self : Vec4, other : Vec4) -> Vec4 {
  self.x = self.x - other.x
  self.y = self.y - other.y
  self.z = self.z - other.z
  self.w = self.w - other.w
  self
}

pub fn scale(self : Vec4, s : Double) -> Vec4 {
  self.x = self.x * s
  self.y = self.y * s
  self.z = self.z * s
  self.w = self.w * s
  self
}

pub fn div_scalar(self : Vec4, s : Double) -> Vec4 {
  self.x = self.x / s
  self.y = self.y / s
  self.z = self.z / s
  self.w = self.w / s
  self
}

/// WGSL-compatible methods
pub fn length(self : Vec4) -> Double {
  (self.x * self.x + self.y * self.y + self.z * self.z + self.w * self.w).sqrt()
}

pub fn length_squared(self : Vec4) -> Double {
  self.x * self.x + self.y * self.y + self.z * self.z + self.w * self.w
}

pub fn normalize(self : Vec4) -> Vec4 {
  let len = self.length()
  if len > 0.0 {
    self.scale(1.0 / len)
  } else {
    self
  }
}

pub fn distance(self : Vec4, other : Vec4) -> Double {
  let dx = self.x - other.x
  let dy = self.y - other.y
  let dz = self.z - other.z
  let dw = self.w - other.w
  (dx * dx + dy * dy + dz * dz + dw * dw).sqrt()
}

/// Immutable operations for safety
pub fn normalized(self : Vec4) -> Vec4 {
  self.clone().normalize()
}

pub fn add(self : Vec4, other : Vec4) -> Vec4 {
  self.clone().add_mut(other)
}

pub fn sub(self : Vec4, other : Vec4) -> Vec4 {
  self.clone().sub_mut(other)
}

pub fn mul(self : Vec4, scalar : Double) -> Vec4 {
  self.clone().scale(scalar)
}

pub fn div(self : Vec4, scalar : Double) -> Vec4 {
  self.clone().div_scalar(scalar)
}

/// WGSL-style free functions (matching shader built-ins)
pub fn vec4(x : Double, y : Double, z : Double, w : Double) -> Vec4 {
  Vec4::new(x, y, z, w)
}

pub fn dot(a : Vec4, b : Vec4) -> Double {
  a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w
}

pub fn reflect(i : Vec4, n : Vec4) -> Vec4 {
  // i - 2.0 * dot(n, i) * n
  i.clone().sub_mut(n.clone().scale(2.0 * dot(n, i)))
}

pub fn mix(a : Vec4, b : Vec4, t : Double) -> Vec4 {
  // WGSL mix function: a * (1 - t) + b * t
  Vec4::new(
    a.x * (1.0 - t) + b.x * t,
    a.y * (1.0 - t) + b.y * t,
    a.z * (1.0 - t) + b.z * t,
    a.w * (1.0 - t) + b.w * t
  )
}

pub fn clamp(v : Vec4, min : Vec4, max : Vec4) -> Vec4 {
  Vec4::new(
    clamp_scalar(v.x, min.x, max.x),
    clamp_scalar(v.y, min.y, max.y),
    clamp_scalar(v.z, min.z, max.z),
    clamp_scalar(v.w, min.w, max.w)
  )
}

pub fn step(edge : Vec4, v : Vec4) -> Vec4 {
  Vec4::new(
    if v.x < edge.x { 0.0 } else { 1.0 },
    if v.y < edge.y { 0.0 } else { 1.0 },
    if v.z < edge.z { 0.0 } else { 1.0 },
    if v.w < edge.w { 0.0 } else { 1.0 }
  )
}

pub fn smoothstep(edge0 : Vec4, edge1 : Vec4, v : Vec4) -> Vec4 {
  let t = clamp(
    v.clone().sub_mut(edge0.clone()).div_components(edge1.clone().sub_mut(edge0.clone())),
    Vec4::zero(),
    Vec4::one()
  )
  Vec4::new(
    t.x * t.x * (3.0 - 2.0 * t.x),
    t.y * t.y * (3.0 - 2.0 * t.y),
    t.z * t.z * (3.0 - 2.0 * t.z),
    t.w * t.w * (3.0 - 2.0 * t.w)
  )
}

/// Component-wise operations
pub fn div_components(self : Vec4, other : Vec4) -> Vec4 {
  self.x = self.x / other.x
  self.y = self.y / other.y
  self.z = self.z / other.z
  self.w = self.w / other.w
  self
}

pub fn abs(v : Vec4) -> Vec4 {
  Vec4::new(v.x.abs(), v.y.abs(), v.z.abs(), v.w.abs())
}

pub fn floor(v : Vec4) -> Vec4 {
  Vec4::new(v.x.floor(), v.y.floor(), v.z.floor(), v.w.floor())
}

pub fn ceil(v : Vec4) -> Vec4 {
  Vec4::new(v.x.ceil(), v.y.ceil(), v.z.ceil(), v.w.ceil())
}

pub fn fract(v : Vec4) -> Vec4 {
  Vec4::new(
    v.x - v.x.floor(),
    v.y - v.y.floor(),
    v.z - v.z.floor(),
    v.w - v.w.floor()
  )
}

pub fn sin(v : Vec4) -> Vec4 {
  Vec4::new(v.x.sin(), v.y.sin(), v.z.sin(), v.w.sin())
}

pub fn cos(v : Vec4) -> Vec4 {
  Vec4::new(v.x.cos(), v.y.cos(), v.z.cos(), v.w.cos())
}

/// Operator overloading for convenience
pub fn op_add(self : Vec4, other : Vec4) -> Vec4 {
  self.add(other)
}

pub fn op_sub(self : Vec4, other : Vec4) -> Vec4 {
  self.sub(other)
}

/// String representation for debugging
pub fn to_string(self : Vec4) -> String {
  "Vec4(" + self.x.to_string() + ", " + self.y.to_string() + ", " + self.z.to_string() + ", " + self.w.to_string() + ")"
}

/// Tests
test "Vec4 constructors" {
  let v1 = Vec4::new(1.0, 2.0, 3.0, 4.0)
  assert_eq(v1.x, 1.0)
  assert_eq(v1.y, 2.0)
  assert_eq(v1.z, 3.0)
  assert_eq(v1.w, 4.0)
  
  let v2 = Vec4::splat(5.0)
  assert_eq(v2.x, 5.0)
  assert_eq(v2.y, 5.0)
  assert_eq(v2.z, 5.0)
  assert_eq(v2.w, 5.0)
  
  let v3 = Vec4::zero()
  assert_eq(v3.x, 0.0)
  assert_eq(v3.y, 0.0)
  assert_eq(v3.z, 0.0)
  assert_eq(v3.w, 0.0)
  
  let v4 = Vec4::one()
  assert_eq(v4.x, 1.0)
  assert_eq(v4.y, 1.0)
  assert_eq(v4.z, 1.0)
  assert_eq(v4.w, 1.0)
}

test "Vec4 basic operations" {
  let v1 = Vec4::new(1.0, 2.0, 3.0, 4.0)
  let v2 = Vec4::new(5.0, 6.0, 7.0, 8.0)
  
  // Test add
  let sum = v1.add(v2)
  assert_eq(sum.x, 6.0)
  assert_eq(sum.y, 8.0)
  assert_eq(sum.z, 10.0)
  assert_eq(sum.w, 12.0)
  
  // Test sub
  let diff = v2.sub(v1)
  assert_eq(diff.x, 4.0)
  assert_eq(diff.y, 4.0)
  assert_eq(diff.z, 4.0)
  assert_eq(diff.w, 4.0)
  
  // Test scale
  let scaled = v1.mul(2.0)
  assert_eq(scaled.x, 2.0)
  assert_eq(scaled.y, 4.0)
  assert_eq(scaled.z, 6.0)
  assert_eq(scaled.w, 8.0)
  
  // Test div
  let divided = v2.div(2.0)
  assert_eq(divided.x, 2.5)
  assert_eq(divided.y, 3.0)
  assert_eq(divided.z, 3.5)
  assert_eq(divided.w, 4.0)
}

test "Vec4 length and normalize" {
  let v = Vec4::new(0.0, 3.0, 4.0, 0.0)
  assert_eq(v.length(), 5.0)
  assert_eq(v.length_squared(), 25.0)
  
  let normalized = v.normalized()
  assert_true((normalized.length() - 1.0).abs() < 0.0001)
}

test "Vec4 dot product" {
  let v1 = Vec4::new(1.0, 2.0, 3.0, 4.0)
  let v2 = Vec4::new(5.0, 6.0, 7.0, 8.0)
  assert_eq(dot(v1, v2), 70.0)  // 1*5 + 2*6 + 3*7 + 4*8 = 5 + 12 + 21 + 32 = 70
}

test "Vec4 operators" {
  let v1 = Vec4::new(1.0, 2.0, 3.0, 4.0)
  let v2 = Vec4::new(5.0, 6.0, 7.0, 8.0)
  
  let sum = v1 + v2
  assert_eq(sum.x, 6.0)
  assert_eq(sum.y, 8.0)
  assert_eq(sum.z, 10.0)
  assert_eq(sum.w, 12.0)
  
  let diff = v2 - v1
  assert_eq(diff.x, 4.0)
  assert_eq(diff.y, 4.0)
  assert_eq(diff.z, 4.0)
  assert_eq(diff.w, 4.0)
  
  let scaled = v1.mul(2.0)
  assert_eq(scaled.x, 2.0)
  assert_eq(scaled.y, 4.0)
  assert_eq(scaled.z, 6.0)
  assert_eq(scaled.w, 8.0)
}