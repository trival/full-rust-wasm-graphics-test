///|
pub struct Mat3 {
  mut data : FixedArray[Double] // Column-major order (like gl-matrix and WGSL)
}

///| Constructors
pub fn Mat3::new() -> Mat3 {
  { data: FixedArray::make(9, 0.0) }
}

///|
pub fn Mat3::identity() -> Mat3 {
  let m = Mat3::new()
  m.data[0] = 1.0 // m00
  m.data[4] = 1.0 // m11
  m.data[8] = 1.0 // m22
  m
}

///|
pub fn Mat3::zero() -> Mat3 {
  Mat3::new()
}

///|
pub fn Mat3::from_values(
  m00 : Double,
  m01 : Double,
  m02 : Double,
  m10 : Double,
  m11 : Double,
  m12 : Double,
  m20 : Double,
  m21 : Double,
  m22 : Double,
) -> Mat3 {
  let m = Mat3::new()
  // Column 0
  m.data[0] = m00
  m.data[1] = m01
  m.data[2] = m02
  // Column 1
  m.data[3] = m10
  m.data[4] = m11
  m.data[5] = m12
  // Column 2
  m.data[6] = m20
  m.data[7] = m21
  m.data[8] = m22
  m
}

///| Clone for safety when needed
pub fn clone(self : Mat3) -> Mat3 {
  let m = Mat3::new()
  m.data[0] = self.data[0]
  m.data[1] = self.data[1]
  m.data[2] = self.data[2]
  m.data[3] = self.data[3]
  m.data[4] = self.data[4]
  m.data[5] = self.data[5]
  m.data[6] = self.data[6]
  m.data[7] = self.data[7]
  m.data[8] = self.data[8]
  m
}

///| Copy values from another matrix
pub fn copy_from(self : Mat3, other : Mat3) -> Mat3 {
  self.data[0] = other.data[0]
  self.data[1] = other.data[1]
  self.data[2] = other.data[2]
  self.data[3] = other.data[3]
  self.data[4] = other.data[4]
  self.data[5] = other.data[5]
  self.data[6] = other.data[6]
  self.data[7] = other.data[7]
  self.data[8] = other.data[8]
  self
}

///| Get/Set elements (row, col)
pub fn get(self : Mat3, row : Int, col : Int) -> Double {
  self.data[col * 3 + row]
}

///|
pub fn set(self : Mat3, row : Int, col : Int, value : Double) -> Unit {
  self.data[col * 3 + row] = value
}

///| Mutable operations for performance
pub fn multiply_mut(self : Mat3, other : Mat3) -> Mat3 {
  let a = self.data
  let b = other.data
  let temp = FixedArray::make(9, 0.0)

  // Column 0
  let b0 = b[0]
  let b1 = b[1]
  let b2 = b[2]
  temp[0] = b0 * a[0] + b1 * a[3] + b2 * a[6]
  temp[1] = b0 * a[1] + b1 * a[4] + b2 * a[7]
  temp[2] = b0 * a[2] + b1 * a[5] + b2 * a[8]

  // Column 1
  let b3 = b[3]
  let b4 = b[4]
  let b5 = b[5]
  temp[3] = b3 * a[0] + b4 * a[3] + b5 * a[6]
  temp[4] = b3 * a[1] + b4 * a[4] + b5 * a[7]
  temp[5] = b3 * a[2] + b4 * a[5] + b5 * a[8]

  // Column 2
  let b6 = b[6]
  let b7 = b[7]
  let b8 = b[8]
  temp[6] = b6 * a[0] + b7 * a[3] + b8 * a[6]
  temp[7] = b6 * a[1] + b7 * a[4] + b8 * a[7]
  temp[8] = b6 * a[2] + b7 * a[5] + b8 * a[8]
  self.data = temp
  self
}

///|
pub fn scale_mut(self : Mat3, sx : Double, sy : Double) -> Mat3 {
  self.data[0] = self.data[0] * sx
  self.data[1] = self.data[1] * sx
  self.data[2] = self.data[2] * sx
  self.data[3] = self.data[3] * sy
  self.data[4] = self.data[4] * sy
  self.data[5] = self.data[5] * sy
  self
}

///|
pub fn translate_mut(self : Mat3, x : Double, y : Double) -> Mat3 {
  self.data[6] = self.data[0] * x + self.data[3] * y + self.data[6]
  self.data[7] = self.data[1] * x + self.data[4] * y + self.data[7]
  self.data[8] = self.data[2] * x + self.data[5] * y + self.data[8]
  self
}

///|
pub fn rotate_mut(self : Mat3, angle : Double) -> Mat3 {
  let s = angle.sin()
  let c = angle.cos()
  let a00 = self.data[0]
  let a01 = self.data[1]
  let a02 = self.data[2]
  let a10 = self.data[3]
  let a11 = self.data[4]
  let a12 = self.data[5]

  // Perform rotation
  self.data[0] = c * a00 + s * a10
  self.data[1] = c * a01 + s * a11
  self.data[2] = c * a02 + s * a12
  self.data[3] = c * a10 - s * a00
  self.data[4] = c * a11 - s * a01
  self.data[5] = c * a12 - s * a02
  self
}

///| Immutable operations
pub fn multiply(self : Mat3, other : Mat3) -> Mat3 {
  self.clone().multiply_mut(other)
}

///|
pub fn scale(self : Mat3, sx : Double, sy : Double) -> Mat3 {
  self.clone().scale_mut(sx, sy)
}

///|
pub fn translate(self : Mat3, x : Double, y : Double) -> Mat3 {
  self.clone().translate_mut(x, y)
}

///|
pub fn rotate(self : Mat3, angle : Double) -> Mat3 {
  self.clone().rotate_mut(angle)
}

///| Matrix operations
pub fn determinant(self : Mat3) -> Double {
  let a = self.data
  let a00 = a[0]
  let a01 = a[1]
  let a02 = a[2]
  let a10 = a[3]
  let a11 = a[4]
  let a12 = a[5]
  let a20 = a[6]
  let a21 = a[7]
  let a22 = a[8]
  a00 * (a22 * a11 - a12 * a21) +
  a01 * (-a22 * a10 + a12 * a20) +
  a02 * (a21 * a10 - a11 * a20)
}

///|
pub fn transpose(self : Mat3) -> Mat3 {
  let a = self.data
  let a01 = a[1]
  let a02 = a[2]
  let a12 = a[5]
  self.data[1] = a[3]
  self.data[2] = a[6]
  self.data[3] = a01
  self.data[5] = a[7]
  self.data[6] = a02
  self.data[7] = a12
  self
}

///|
pub fn inverse(self : Mat3) -> Mat3? {
  let a = self.data
  let a00 = a[0]
  let a01 = a[1]
  let a02 = a[2]
  let a10 = a[3]
  let a11 = a[4]
  let a12 = a[5]
  let a20 = a[6]
  let a21 = a[7]
  let a22 = a[8]
  let b01 = a22 * a11 - a12 * a21
  let b11 = -a22 * a10 + a12 * a20
  let b21 = a21 * a10 - a11 * a20
  let det = a00 * b01 + a01 * b11 + a02 * b21
  if det.abs() < 0.000001 {
    None
  } else {
    let inv_det = 1.0 / det
    let result = Mat3::new()
    result.data[0] = b01 * inv_det
    result.data[1] = (-a22 * a01 + a02 * a21) * inv_det
    result.data[2] = (a12 * a01 - a02 * a11) * inv_det
    result.data[3] = b11 * inv_det
    result.data[4] = (a22 * a00 - a02 * a20) * inv_det
    result.data[5] = (-a12 * a00 + a02 * a10) * inv_det
    result.data[6] = b21 * inv_det
    result.data[7] = (-a21 * a00 + a01 * a20) * inv_det
    result.data[8] = (a11 * a00 - a01 * a10) * inv_det
    Some(result)
  }
}

///| Transform a Vec2 (as a point)
pub fn transform_point(self : Mat3, v : Vec2) -> Vec2 {
  let x = v.x
  let y = v.y
  let m = self.data
  Vec2::new(m[0] * x + m[3] * y + m[6], m[1] * x + m[4] * y + m[7])
}

///| Transform a Vec2 (as a direction, no translation)
pub fn transform_direction(self : Mat3, v : Vec2) -> Vec2 {
  let x = v.x
  let y = v.y
  let m = self.data
  Vec2::new(m[0] * x + m[3] * y, m[1] * x + m[4] * y)
}

///| Factory methods for common transformations
pub fn from_translation(x : Double, y : Double) -> Mat3 {
  let m = Mat3::identity()
  m.data[6] = x
  m.data[7] = y
  m
}

///|
pub fn from_rotation(angle : Double) -> Mat3 {
  let m = Mat3::identity()
  let s = angle.sin()
  let c = angle.cos()
  m.data[0] = c
  m.data[1] = s
  m.data[3] = -s
  m.data[4] = c
  m
}

///|
pub fn from_scale(sx : Double, sy : Double) -> Mat3 {
  let m = Mat3::identity()
  m.data[0] = sx
  m.data[4] = sy
  m
}

///| Operator overloading
pub fn op_mul(self : Mat3, other : Mat3) -> Mat3 {
  self.multiply(other)
}

///| String representation for debugging
pub fn to_string(self : Mat3) -> String {
  let d = self.data
  "Mat3(\n" +
  "  [" +
  d[0].to_string() +
  ", " +
  d[3].to_string() +
  ", " +
  d[6].to_string() +
  "]\n" +
  "  [" +
  d[1].to_string() +
  ", " +
  d[4].to_string() +
  ", " +
  d[7].to_string() +
  "]\n" +
  "  [" +
  d[2].to_string() +
  ", " +
  d[5].to_string() +
  ", " +
  d[8].to_string() +
  "]\n" +
  ")"
}

///| Aligned version for GPU buffers (WGSL std140 layout)
/// In WGSL, mat3x3 takes up 3 × vec4 = 48 bytes
pub struct Mat3Aligned {
  mut data : FixedArray[Double] // 12 elements (3 columns × 4 floats each)
}

///|
pub fn to_aligned(self : Mat3) -> Mat3Aligned {
  let aligned = { data: FixedArray::make(12, 0.0) }

  // Column 0 (with padding)
  aligned.data[0] = self.data[0] // m00
  aligned.data[1] = self.data[1] // m01
  aligned.data[2] = self.data[2] // m02
  aligned.data[3] = 0.0 // padding

  // Column 1 (with padding)
  aligned.data[4] = self.data[3] // m10
  aligned.data[5] = self.data[4] // m11
  aligned.data[6] = self.data[5] // m12
  aligned.data[7] = 0.0 // padding

  // Column 2 (with padding)
  aligned.data[8] = self.data[6] // m20
  aligned.data[9] = self.data[7] // m21
  aligned.data[10] = self.data[8] // m22
  aligned.data[11] = 0.0 // padding
  aligned
}

///| Tests
test "Mat3 constructors" {
  let m1 = Mat3::identity()
  assert_eq(m1.get(0, 0), 1.0)
  assert_eq(m1.get(1, 1), 1.0)
  assert_eq(m1.get(2, 2), 1.0)
  assert_eq(m1.get(0, 1), 0.0)
  assert_eq(m1.get(1, 0), 0.0)
  let m2 = Mat3::zero()
  assert_eq(m2.get(0, 0), 0.0)
  assert_eq(m2.get(1, 1), 0.0)
  assert_eq(m2.get(2, 2), 0.0)
}

///|
test "Mat3 multiply" {
  let m1 = Mat3::from_scale(2.0, 3.0)
  let m2 = Mat3::from_translation(5.0, 7.0)
  let result = m2.multiply(m1) // First scale, then translate

  // Check that (1,1) transforms to (2*1+5, 3*1+7) = (7, 10)
  let transformed = result.transform_point(Vec2::new(1.0, 1.0))
  assert_eq(transformed.x, 7.0)
  assert_eq(transformed.y, 10.0)
}

///|
test "Mat3 transformations" {
  // Test translation
  let t = Mat3::from_translation(10.0, 20.0)
  let p1 = t.transform_point(Vec2::new(5.0, 5.0))
  assert_eq(p1.x, 15.0)
  assert_eq(p1.y, 25.0)

  // Test rotation (90 degrees)
  let r = Mat3::from_rotation(radians_scalar(90.0))
  let p2 = r.transform_point(Vec2::new(1.0, 0.0))
  assert_true((p2.x - 0.0).abs() < 0.0001)
  assert_true((p2.y - 1.0).abs() < 0.0001)

  // Test scale
  let s = Mat3::from_scale(2.0, 3.0)
  let p3 = s.transform_point(Vec2::new(5.0, 5.0))
  assert_eq(p3.x, 10.0)
  assert_eq(p3.y, 15.0)
}

///|
test "Mat3 inverse" {
  let m = Mat3::from_values(1.0, 2.0, 3.0, 0.0, 1.0, 4.0, 5.0, 6.0, 0.0)
  match m.inverse() {
    Some(inv) => {
      let identity = m.multiply(inv)
      // Check diagonal elements are ~1
      assert_true((identity.get(0, 0) - 1.0).abs() < 0.0001)
      assert_true((identity.get(1, 1) - 1.0).abs() < 0.0001)
      assert_true((identity.get(2, 2) - 1.0).abs() < 0.0001)
      // Check off-diagonal elements are ~0
      assert_true(identity.get(0, 1).abs() < 0.0001)
      assert_true(identity.get(1, 0).abs() < 0.0001)
    }
    None => panic("Matrix should be invertible")
  }
}
