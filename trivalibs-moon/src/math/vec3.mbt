pub struct Vec3 {
  mut x : Double
  mut y : Double
  mut z : Double
}

/// Constructors matching WGSL
pub fn Vec3::new(x : Double, y : Double, z : Double) -> Vec3 {
  { x, y, z }
}

pub fn Vec3::splat(v : Double) -> Vec3 {
  Vec3::new(v, v, v)
}

pub fn Vec3::zero() -> Vec3 {
  Vec3::new(0.0, 0.0, 0.0)
}

pub fn Vec3::one() -> Vec3 {
  Vec3::new(1.0, 1.0, 1.0)
}

/// Clone for safety when needed
pub fn clone(self : Vec3) -> Vec3 {
  Vec3::new(self.x, self.y, self.z)
}

/// Mutable operations (return self for chaining)
pub fn add_mut(self : Vec3, other : Vec3) -> Vec3 {
  self.x = self.x + other.x
  self.y = self.y + other.y
  self.z = self.z + other.z
  self
}

pub fn sub_mut(self : Vec3, other : Vec3) -> Vec3 {
  self.x = self.x - other.x
  self.y = self.y - other.y
  self.z = self.z - other.z
  self
}

pub fn scale(self : Vec3, s : Double) -> Vec3 {
  self.x = self.x * s
  self.y = self.y * s
  self.z = self.z * s
  self
}

pub fn div_scalar(self : Vec3, s : Double) -> Vec3 {
  self.x = self.x / s
  self.y = self.y / s
  self.z = self.z / s
  self
}

/// WGSL-compatible methods
pub fn length(self : Vec3) -> Double {
  (self.x * self.x + self.y * self.y + self.z * self.z).sqrt()
}

pub fn length_squared(self : Vec3) -> Double {
  self.x * self.x + self.y * self.y + self.z * self.z
}

pub fn normalize(self : Vec3) -> Vec3 {
  let len = self.length()
  if len > 0.0 {
    self.scale(1.0 / len)
  } else {
    self
  }
}

pub fn distance(self : Vec3, other : Vec3) -> Double {
  let dx = self.x - other.x
  let dy = self.y - other.y
  let dz = self.z - other.z
  (dx * dx + dy * dy + dz * dz).sqrt()
}

/// Immutable operations for safety
pub fn normalized(self : Vec3) -> Vec3 {
  self.clone().normalize()
}

pub fn add(self : Vec3, other : Vec3) -> Vec3 {
  self.clone().add_mut(other)
}

pub fn sub(self : Vec3, other : Vec3) -> Vec3 {
  self.clone().sub_mut(other)
}

pub fn mul(self : Vec3, scalar : Double) -> Vec3 {
  self.clone().scale(scalar)
}

pub fn div(self : Vec3, scalar : Double) -> Vec3 {
  self.clone().div_scalar(scalar)
}

/// WGSL-style free functions (matching shader built-ins)
pub fn vec3(x : Double, y : Double, z : Double) -> Vec3 {
  Vec3::new(x, y, z)
}

pub fn dot(a : Vec3, b : Vec3) -> Double {
  a.x * b.x + a.y * b.y + a.z * b.z
}

pub fn cross(a : Vec3, b : Vec3) -> Vec3 {
  Vec3::new(
    a.y * b.z - a.z * b.y,
    a.z * b.x - a.x * b.z,
    a.x * b.y - a.y * b.x
  )
}

pub fn reflect(i : Vec3, n : Vec3) -> Vec3 {
  // i - 2.0 * dot(n, i) * n
  i.clone().sub_mut(n.clone().scale(2.0 * dot(n, i)))
}

pub fn refract(i : Vec3, n : Vec3, eta : Double) -> Vec3 {
  let n_dot_i = dot(n, i)
  let k = 1.0 - eta * eta * (1.0 - n_dot_i * n_dot_i)
  if k < 0.0 {
    Vec3::zero()
  } else {
    i.clone().scale(eta).sub_mut(n.clone().scale(eta * n_dot_i + k.sqrt()))
  }
}

pub fn mix(a : Vec3, b : Vec3, t : Double) -> Vec3 {
  // WGSL mix function: a * (1 - t) + b * t
  Vec3::new(
    a.x * (1.0 - t) + b.x * t,
    a.y * (1.0 - t) + b.y * t,
    a.z * (1.0 - t) + b.z * t
  )
}

pub fn clamp(v : Vec3, min : Vec3, max : Vec3) -> Vec3 {
  Vec3::new(
    clamp_scalar(v.x, min.x, max.x),
    clamp_scalar(v.y, min.y, max.y),
    clamp_scalar(v.z, min.z, max.z)
  )
}

pub fn step(edge : Vec3, v : Vec3) -> Vec3 {
  Vec3::new(
    if v.x < edge.x { 0.0 } else { 1.0 },
    if v.y < edge.y { 0.0 } else { 1.0 },
    if v.z < edge.z { 0.0 } else { 1.0 }
  )
}

pub fn smoothstep(edge0 : Vec3, edge1 : Vec3, v : Vec3) -> Vec3 {
  let t = clamp(
    v.clone().sub_mut(edge0.clone()).div_components(edge1.clone().sub_mut(edge0.clone())),
    Vec3::zero(),
    Vec3::one()
  )
  Vec3::new(
    t.x * t.x * (3.0 - 2.0 * t.x),
    t.y * t.y * (3.0 - 2.0 * t.y),
    t.z * t.z * (3.0 - 2.0 * t.z)
  )
}

/// Component-wise operations
pub fn div_components(self : Vec3, other : Vec3) -> Vec3 {
  self.x = self.x / other.x
  self.y = self.y / other.y
  self.z = self.z / other.z
  self
}

pub fn abs(v : Vec3) -> Vec3 {
  Vec3::new(v.x.abs(), v.y.abs(), v.z.abs())
}

pub fn floor(v : Vec3) -> Vec3 {
  Vec3::new(v.x.floor(), v.y.floor(), v.z.floor())
}

pub fn ceil(v : Vec3) -> Vec3 {
  Vec3::new(v.x.ceil(), v.y.ceil(), v.z.ceil())
}

pub fn fract(v : Vec3) -> Vec3 {
  Vec3::new(
    v.x - v.x.floor(),
    v.y - v.y.floor(),
    v.z - v.z.floor()
  )
}

pub fn sin(v : Vec3) -> Vec3 {
  Vec3::new(v.x.sin(), v.y.sin(), v.z.sin())
}

pub fn cos(v : Vec3) -> Vec3 {
  Vec3::new(v.x.cos(), v.y.cos(), v.z.cos())
}

/// Operator overloading for convenience
pub fn op_add(self : Vec3, other : Vec3) -> Vec3 {
  self.add(other)
}

pub fn op_sub(self : Vec3, other : Vec3) -> Vec3 {
  self.sub(other)
}

/// String representation for debugging
pub fn to_string(self : Vec3) -> String {
  "Vec3(" + self.x.to_string() + ", " + self.y.to_string() + ", " + self.z.to_string() + ")"
}

/// Aligned version for GPU buffers (WGSL std140 layout)
pub struct Vec3Aligned {
  mut x : Double
  mut y : Double
  mut z : Double
  mut _padding : Double  // Ensure 16-byte alignment
}

pub fn to_aligned(self : Vec3) -> Vec3Aligned {
  { x: self.x, y: self.y, z: self.z, _padding: 0.0 }
}

/// Tests
test "Vec3 constructors" {
  let v1 = Vec3::new(1.0, 2.0, 3.0)
  assert_eq(v1.x, 1.0)
  assert_eq(v1.y, 2.0)
  assert_eq(v1.z, 3.0)
  
  let v2 = Vec3::splat(4.0)
  assert_eq(v2.x, 4.0)
  assert_eq(v2.y, 4.0)
  assert_eq(v2.z, 4.0)
  
  let v3 = Vec3::zero()
  assert_eq(v3.x, 0.0)
  assert_eq(v3.y, 0.0)
  assert_eq(v3.z, 0.0)
  
  let v4 = Vec3::one()
  assert_eq(v4.x, 1.0)
  assert_eq(v4.y, 1.0)
  assert_eq(v4.z, 1.0)
}

test "Vec3 basic operations" {
  let v1 = Vec3::new(1.0, 2.0, 3.0)
  let v2 = Vec3::new(4.0, 5.0, 6.0)
  
  // Test add
  let sum = v1.add(v2)
  assert_eq(sum.x, 5.0)
  assert_eq(sum.y, 7.0)
  assert_eq(sum.z, 9.0)
  
  // Test sub
  let diff = v2.sub(v1)
  assert_eq(diff.x, 3.0)
  assert_eq(diff.y, 3.0)
  assert_eq(diff.z, 3.0)
  
  // Test scale
  let scaled = v1.mul(2.0)
  assert_eq(scaled.x, 2.0)
  assert_eq(scaled.y, 4.0)
  assert_eq(scaled.z, 6.0)
  
  // Test div
  let divided = v2.div(2.0)
  assert_eq(divided.x, 2.0)
  assert_eq(divided.y, 2.5)
  assert_eq(divided.z, 3.0)
}

test "Vec3 length and normalize" {
  let v = Vec3::new(2.0, 3.0, 6.0)
  assert_eq(v.length(), 7.0)
  assert_eq(v.length_squared(), 49.0)
  
  let normalized = v.normalized()
  assert_true((normalized.length() - 1.0).abs() < 0.0001)
}

test "Vec3 dot and cross product" {
  let v1 = Vec3::new(1.0, 2.0, 3.0)
  let v2 = Vec3::new(4.0, 5.0, 6.0)
  assert_eq(dot(v1, v2), 32.0)
  
  let v3 = Vec3::new(1.0, 0.0, 0.0)
  let v4 = Vec3::new(0.0, 1.0, 0.0)
  let crossed = cross(v3, v4)
  assert_eq(crossed.x, 0.0)
  assert_eq(crossed.y, 0.0)
  assert_eq(crossed.z, 1.0)
}

test "Vec3 distance" {
  let v1 = Vec3::new(0.0, 0.0, 0.0)
  let v2 = Vec3::new(2.0, 3.0, 6.0)
  assert_eq(v1.distance(v2), 7.0)
}

test "Vec3 operators" {
  let v1 = Vec3::new(1.0, 2.0, 3.0)
  let v2 = Vec3::new(4.0, 5.0, 6.0)
  
  let sum = v1 + v2
  assert_eq(sum.x, 5.0)
  assert_eq(sum.y, 7.0)
  assert_eq(sum.z, 9.0)
  
  let diff = v2 - v1
  assert_eq(diff.x, 3.0)
  assert_eq(diff.y, 3.0)
  assert_eq(diff.z, 3.0)
  
  let scaled = v1.mul(2.0)
  assert_eq(scaled.x, 2.0)
  assert_eq(scaled.y, 4.0)
  assert_eq(scaled.z, 6.0)
  
  let divided = v2.div(2.0)
  assert_eq(divided.x, 2.0)
  assert_eq(divided.y, 2.5)
  assert_eq(divided.z, 3.0)
}

test "Vec3 WGSL functions" {
  // Test clamp
  let clamped = clamp(
    Vec3::new(-0.5, 0.5, 1.5),
    Vec3::zero(),
    Vec3::one()
  )
  assert_eq(clamped.x, 0.0)
  assert_eq(clamped.y, 0.5)
  assert_eq(clamped.z, 1.0)
  
  // Test mix
  let mixed = mix(Vec3::zero(), Vec3::one(), 0.5)
  assert_eq(mixed.x, 0.5)
  assert_eq(mixed.y, 0.5)
  assert_eq(mixed.z, 0.5)
  
  // Test reflect
  let i = Vec3::new(1.0, -1.0, 0.0)
  let n = Vec3::new(0.0, 1.0, 0.0)
  let reflected = reflect(i, n)
  assert_eq(reflected.x, 1.0)
  assert_eq(reflected.y, 1.0)
  assert_eq(reflected.z, 0.0)
}