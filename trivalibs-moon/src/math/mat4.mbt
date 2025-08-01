pub struct Mat4 {
  mut data : FixedArray[Double]  // Column-major order (like gl-matrix and WGSL)
}

/// Constructors
pub fn Mat4::new() -> Mat4 {
  { data: FixedArray::make(16, 0.0) }
}

pub fn Mat4::identity() -> Mat4 {
  let m = Mat4::new()
  m.data[0] = 1.0   // m00
  m.data[5] = 1.0   // m11
  m.data[10] = 1.0  // m22
  m.data[15] = 1.0  // m33
  m
}

pub fn Mat4::zero() -> Mat4 {
  Mat4::new()
}

pub fn Mat4::from_values(
  m00 : Double, m01 : Double, m02 : Double, m03 : Double,
  m10 : Double, m11 : Double, m12 : Double, m13 : Double,
  m20 : Double, m21 : Double, m22 : Double, m23 : Double,
  m30 : Double, m31 : Double, m32 : Double, m33 : Double
) -> Mat4 {
  let m = Mat4::new()
  // Column 0
  m.data[0] = m00
  m.data[1] = m01
  m.data[2] = m02
  m.data[3] = m03
  // Column 1
  m.data[4] = m10
  m.data[5] = m11
  m.data[6] = m12
  m.data[7] = m13
  // Column 2
  m.data[8] = m20
  m.data[9] = m21
  m.data[10] = m22
  m.data[11] = m23
  // Column 3
  m.data[12] = m30
  m.data[13] = m31
  m.data[14] = m32
  m.data[15] = m33
  m
}

/// Clone for safety when needed
pub fn clone(self : Mat4) -> Mat4 {
  let m = Mat4::new()
  m.data[0] = self.data[0]
  m.data[1] = self.data[1]
  m.data[2] = self.data[2]
  m.data[3] = self.data[3]
  m.data[4] = self.data[4]
  m.data[5] = self.data[5]
  m.data[6] = self.data[6]
  m.data[7] = self.data[7]
  m.data[8] = self.data[8]
  m.data[9] = self.data[9]
  m.data[10] = self.data[10]
  m.data[11] = self.data[11]
  m.data[12] = self.data[12]
  m.data[13] = self.data[13]
  m.data[14] = self.data[14]
  m.data[15] = self.data[15]
  m
}

/// Copy values from another matrix
pub fn copy_from(self : Mat4, other : Mat4) -> Mat4 {
  self.data[0] = other.data[0]
  self.data[1] = other.data[1]
  self.data[2] = other.data[2]
  self.data[3] = other.data[3]
  self.data[4] = other.data[4]
  self.data[5] = other.data[5]
  self.data[6] = other.data[6]
  self.data[7] = other.data[7]
  self.data[8] = other.data[8]
  self.data[9] = other.data[9]
  self.data[10] = other.data[10]
  self.data[11] = other.data[11]
  self.data[12] = other.data[12]
  self.data[13] = other.data[13]
  self.data[14] = other.data[14]
  self.data[15] = other.data[15]
  self
}

/// Get/Set elements (row, col)
pub fn get(self : Mat4, row : Int, col : Int) -> Double {
  self.data[col * 4 + row]
}

pub fn set(self : Mat4, row : Int, col : Int, value : Double) -> Unit {
  self.data[col * 4 + row] = value
}

/// Mutable operations for performance
pub fn multiply_mut(self : Mat4, other : Mat4) -> Mat4 {
  let a = self.data
  let b = other.data
  let temp = FixedArray::make(16, 0.0)
  
  // Unrolled for performance (following gl-matrix)
  let b0 = b[0]
  let b1 = b[1]
  let b2 = b[2]
  let b3 = b[3]
  temp[0] = b0 * a[0] + b1 * a[4] + b2 * a[8] + b3 * a[12]
  temp[1] = b0 * a[1] + b1 * a[5] + b2 * a[9] + b3 * a[13]
  temp[2] = b0 * a[2] + b1 * a[6] + b2 * a[10] + b3 * a[14]
  temp[3] = b0 * a[3] + b1 * a[7] + b2 * a[11] + b3 * a[15]
  
  let b0 = b[4]
  let b1 = b[5]
  let b2 = b[6]
  let b3 = b[7]
  temp[4] = b0 * a[0] + b1 * a[4] + b2 * a[8] + b3 * a[12]
  temp[5] = b0 * a[1] + b1 * a[5] + b2 * a[9] + b3 * a[13]
  temp[6] = b0 * a[2] + b1 * a[6] + b2 * a[10] + b3 * a[14]
  temp[7] = b0 * a[3] + b1 * a[7] + b2 * a[11] + b3 * a[15]
  
  let b0 = b[8]
  let b1 = b[9]
  let b2 = b[10]
  let b3 = b[11]
  temp[8] = b0 * a[0] + b1 * a[4] + b2 * a[8] + b3 * a[12]
  temp[9] = b0 * a[1] + b1 * a[5] + b2 * a[9] + b3 * a[13]
  temp[10] = b0 * a[2] + b1 * a[6] + b2 * a[10] + b3 * a[14]
  temp[11] = b0 * a[3] + b1 * a[7] + b2 * a[11] + b3 * a[15]
  
  let b0 = b[12]
  let b1 = b[13]
  let b2 = b[14]
  let b3 = b[15]
  temp[12] = b0 * a[0] + b1 * a[4] + b2 * a[8] + b3 * a[12]
  temp[13] = b0 * a[1] + b1 * a[5] + b2 * a[9] + b3 * a[13]
  temp[14] = b0 * a[2] + b1 * a[6] + b2 * a[10] + b3 * a[14]
  temp[15] = b0 * a[3] + b1 * a[7] + b2 * a[11] + b3 * a[15]
  
  self.data = temp
  self
}

pub fn translate_mut(self : Mat4, v : Vec3) -> Mat4 {
  let x = v.x
  let y = v.y
  let z = v.z
  
  self.data[12] = self.data[0] * x + self.data[4] * y + self.data[8] * z + self.data[12]
  self.data[13] = self.data[1] * x + self.data[5] * y + self.data[9] * z + self.data[13]
  self.data[14] = self.data[2] * x + self.data[6] * y + self.data[10] * z + self.data[14]
  self.data[15] = self.data[3] * x + self.data[7] * y + self.data[11] * z + self.data[15]
  
  self
}

pub fn scale_mut(self : Mat4, v : Vec3) -> Mat4 {
  let x = v.x
  let y = v.y
  let z = v.z
  
  self.data[0] = self.data[0] * x
  self.data[1] = self.data[1] * x
  self.data[2] = self.data[2] * x
  self.data[3] = self.data[3] * x
  
  self.data[4] = self.data[4] * y
  self.data[5] = self.data[5] * y
  self.data[6] = self.data[6] * y
  self.data[7] = self.data[7] * y
  
  self.data[8] = self.data[8] * z
  self.data[9] = self.data[9] * z
  self.data[10] = self.data[10] * z
  self.data[11] = self.data[11] * z
  
  self
}

pub fn rotate_mut(self : Mat4, angle : Double, axis : Vec3) -> Mat4 {
  let len = axis.length()
  if len.abs() < 0.00001 {
    return self
  }
  
  let x = axis.x / len
  let y = axis.y / len
  let z = axis.z / len
  
  let s = angle.sin()
  let c = angle.cos()
  let t = 1.0 - c
  
  let a00 = self.data[0]
  let a01 = self.data[1]
  let a02 = self.data[2]
  let a03 = self.data[3]
  let a10 = self.data[4]
  let a11 = self.data[5]
  let a12 = self.data[6]
  let a13 = self.data[7]
  let a20 = self.data[8]
  let a21 = self.data[9]
  let a22 = self.data[10]
  let a23 = self.data[11]
  
  // Construct rotation matrix
  let b00 = x * x * t + c
  let b01 = y * x * t + z * s
  let b02 = z * x * t - y * s
  let b10 = x * y * t - z * s
  let b11 = y * y * t + c
  let b12 = z * y * t + x * s
  let b20 = x * z * t + y * s
  let b21 = y * z * t - x * s
  let b22 = z * z * t + c
  
  // Apply rotation
  self.data[0] = a00 * b00 + a10 * b01 + a20 * b02
  self.data[1] = a01 * b00 + a11 * b01 + a21 * b02
  self.data[2] = a02 * b00 + a12 * b01 + a22 * b02
  self.data[3] = a03 * b00 + a13 * b01 + a23 * b02
  
  self.data[4] = a00 * b10 + a10 * b11 + a20 * b12
  self.data[5] = a01 * b10 + a11 * b11 + a21 * b12
  self.data[6] = a02 * b10 + a12 * b11 + a22 * b12
  self.data[7] = a03 * b10 + a13 * b11 + a23 * b12
  
  self.data[8] = a00 * b20 + a10 * b21 + a20 * b22
  self.data[9] = a01 * b20 + a11 * b21 + a21 * b22
  self.data[10] = a02 * b20 + a12 * b21 + a22 * b22
  self.data[11] = a03 * b20 + a13 * b21 + a23 * b22
  
  self
}

/// Immutable operations
pub fn multiply(self : Mat4, other : Mat4) -> Mat4 {
  self.clone().multiply_mut(other)
}

pub fn translate(self : Mat4, v : Vec3) -> Mat4 {
  self.clone().translate_mut(v)
}

pub fn scale(self : Mat4, v : Vec3) -> Mat4 {
  self.clone().scale_mut(v)
}

pub fn rotate(self : Mat4, angle : Double, axis : Vec3) -> Mat4 {
  self.clone().rotate_mut(angle, axis)
}

/// Matrix operations
pub fn determinant(self : Mat4) -> Double {
  let a = self.data
  let a00 = a[0]
  let a01 = a[1]
  let a02 = a[2]
  let a03 = a[3]
  let a10 = a[4]
  let a11 = a[5]
  let a12 = a[6]
  let a13 = a[7]
  let a20 = a[8]
  let a21 = a[9]
  let a22 = a[10]
  let a23 = a[11]
  let a30 = a[12]
  let a31 = a[13]
  let a32 = a[14]
  let a33 = a[15]
  
  let b00 = a00 * a11 - a01 * a10
  let b01 = a00 * a12 - a02 * a10
  let b02 = a00 * a13 - a03 * a10
  let b03 = a01 * a12 - a02 * a11
  let b04 = a01 * a13 - a03 * a11
  let b05 = a02 * a13 - a03 * a12
  let b06 = a20 * a31 - a21 * a30
  let b07 = a20 * a32 - a22 * a30
  let b08 = a20 * a33 - a23 * a30
  let b09 = a21 * a32 - a22 * a31
  let b10 = a21 * a33 - a23 * a31
  let b11 = a22 * a33 - a23 * a32
  
  b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06
}

pub fn transpose(self : Mat4) -> Mat4 {
  let a = self.data
  let a01 = a[1]
  let a02 = a[2]
  let a03 = a[3]
  let a12 = a[6]
  let a13 = a[7]
  let a23 = a[11]
  
  self.data[1] = a[4]
  self.data[2] = a[8]
  self.data[3] = a[12]
  self.data[4] = a01
  self.data[6] = a[9]
  self.data[7] = a[13]
  self.data[8] = a02
  self.data[9] = a12
  self.data[11] = a[14]
  self.data[12] = a03
  self.data[13] = a13
  self.data[14] = a23
  
  self
}

pub fn inverse(self : Mat4) -> Mat4? {
  let a = self.data
  let a00 = a[0]
  let a01 = a[1]
  let a02 = a[2]
  let a03 = a[3]
  let a10 = a[4]
  let a11 = a[5]
  let a12 = a[6]
  let a13 = a[7]
  let a20 = a[8]
  let a21 = a[9]
  let a22 = a[10]
  let a23 = a[11]
  let a30 = a[12]
  let a31 = a[13]
  let a32 = a[14]
  let a33 = a[15]
  
  let b00 = a00 * a11 - a01 * a10
  let b01 = a00 * a12 - a02 * a10
  let b02 = a00 * a13 - a03 * a10
  let b03 = a01 * a12 - a02 * a11
  let b04 = a01 * a13 - a03 * a11
  let b05 = a02 * a13 - a03 * a12
  let b06 = a20 * a31 - a21 * a30
  let b07 = a20 * a32 - a22 * a30
  let b08 = a20 * a33 - a23 * a30
  let b09 = a21 * a32 - a22 * a31
  let b10 = a21 * a33 - a23 * a31
  let b11 = a22 * a33 - a23 * a32
  
  let det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06
  
  if det.abs() < 0.000001 {
    None
  } else {
    let inv_det = 1.0 / det
    let result = Mat4::new()
    
    result.data[0] = (a11 * b11 - a12 * b10 + a13 * b09) * inv_det
    result.data[1] = (a02 * b10 - a01 * b11 - a03 * b09) * inv_det
    result.data[2] = (a31 * b05 - a32 * b04 + a33 * b03) * inv_det
    result.data[3] = (a22 * b04 - a21 * b05 - a23 * b03) * inv_det
    result.data[4] = (a12 * b08 - a10 * b11 - a13 * b07) * inv_det
    result.data[5] = (a00 * b11 - a02 * b08 + a03 * b07) * inv_det
    result.data[6] = (a32 * b02 - a30 * b05 - a33 * b01) * inv_det
    result.data[7] = (a20 * b05 - a22 * b02 + a23 * b01) * inv_det
    result.data[8] = (a10 * b10 - a11 * b08 + a13 * b06) * inv_det
    result.data[9] = (a01 * b08 - a00 * b10 - a03 * b06) * inv_det
    result.data[10] = (a30 * b04 - a31 * b02 + a33 * b00) * inv_det
    result.data[11] = (a21 * b02 - a20 * b04 - a23 * b00) * inv_det
    result.data[12] = (a11 * b07 - a10 * b09 - a12 * b06) * inv_det
    result.data[13] = (a00 * b09 - a01 * b07 + a02 * b06) * inv_det
    result.data[14] = (a31 * b01 - a30 * b03 - a32 * b00) * inv_det
    result.data[15] = (a20 * b03 - a21 * b01 + a22 * b00) * inv_det
    
    Some(result)
  }
}

/// Transform operations
pub fn transform_vec4(self : Mat4, v : Vec4) -> Vec4 {
  let m = self.data
  Vec4::new(
    m[0] * v.x + m[4] * v.y + m[8] * v.z + m[12] * v.w,
    m[1] * v.x + m[5] * v.y + m[9] * v.z + m[13] * v.w,
    m[2] * v.x + m[6] * v.y + m[10] * v.z + m[14] * v.w,
    m[3] * v.x + m[7] * v.y + m[11] * v.z + m[15] * v.w
  )
}

/// WGSL-style free functions
pub fn mat4x4(c0 : Vec4, c1 : Vec4, c2 : Vec4, c3 : Vec4) -> Mat4 {
  let m = Mat4::new()
  // Column 0
  m.data[0] = c0.x
  m.data[1] = c0.y
  m.data[2] = c0.z
  m.data[3] = c0.w
  // Column 1
  m.data[4] = c1.x
  m.data[5] = c1.y
  m.data[6] = c1.z
  m.data[7] = c1.w
  // Column 2
  m.data[8] = c2.x
  m.data[9] = c2.y
  m.data[10] = c2.z
  m.data[11] = c2.w
  // Column 3
  m.data[12] = c3.x
  m.data[13] = c3.y
  m.data[14] = c3.z
  m.data[15] = c3.w
  m
}

/// Common shader-like operations
pub fn Mat4::transform_point(m : Mat4, p : Vec3) -> Vec3 {
  let v4 = m.transform_vec4(Vec4::new(p.x, p.y, p.z, 1.0))
  Vec3::new(v4.x / v4.w, v4.y / v4.w, v4.z / v4.w)
}

pub fn Mat4::transform_direction(m : Mat4, d : Vec3) -> Vec3 {
  let v4 = m.transform_vec4(Vec4::new(d.x, d.y, d.z, 0.0))
  Vec3::new(v4.x, v4.y, v4.z)
}

/// Matrix construction helpers (matching WGSL patterns)
pub fn Mat4::perspective(fovy : Double, aspect : Double, near : Double, far : Double) -> Mat4 {
  let f = 1.0 / (fovy / 2.0).tan()
  let nf = 1.0 / (near - far)
  
  let m = Mat4::zero()
  m.data[0] = f / aspect
  m.data[5] = f
  m.data[10] = (far + near) * nf
  m.data[11] = -1.0
  m.data[14] = 2.0 * far * near * nf
  m
}

pub fn Mat4::ortho(left : Double, right : Double, bottom : Double, top : Double, near : Double, far : Double) -> Mat4 {
  let lr = 1.0 / (left - right)
  let bt = 1.0 / (bottom - top)
  let nf = 1.0 / (near - far)
  
  let m = Mat4::zero()
  m.data[0] = -2.0 * lr
  m.data[5] = -2.0 * bt
  m.data[10] = 2.0 * nf
  m.data[12] = (left + right) * lr
  m.data[13] = (top + bottom) * bt
  m.data[14] = (far + near) * nf
  m.data[15] = 1.0
  m
}

pub fn Mat4::look_at(eye : Vec3, center : Vec3, up : Vec3) -> Mat4 {
  let eyex = eye.x
  let eyey = eye.y
  let eyez = eye.z
  let upx = up.x
  let upy = up.y
  let upz = up.z
  let centerx = center.x
  let centery = center.y
  let centerz = center.z
  
  let z0 = eyex - centerx
  let z1 = eyey - centery
  let z2 = eyez - centerz
  let len = z0 * z0 + z1 * z1 + z2 * z2
  
  if len > 0.0 {
    let len = 1.0 / len.sqrt()
    let z0 = z0 * len
    let z1 = z1 * len
    let z2 = z2 * len
    
    let x0 = upy * z2 - upz * z1
    let x1 = upz * z0 - upx * z2
    let x2 = upx * z1 - upy * z0
    let len = x0 * x0 + x1 * x1 + x2 * x2
    
    if len > 0.0 {
      let len = 1.0 / len.sqrt()
      let x0 = x0 * len
      let x1 = x1 * len
      let x2 = x2 * len
      
      let y0 = z1 * x2 - z2 * x1
      let y1 = z2 * x0 - z0 * x2
      let y2 = z0 * x1 - z1 * x0
      
      let m = Mat4::new()
      m.data[0] = x0
      m.data[1] = y0
      m.data[2] = z0
      m.data[3] = 0.0
      m.data[4] = x1
      m.data[5] = y1
      m.data[6] = z1
      m.data[7] = 0.0
      m.data[8] = x2
      m.data[9] = y2
      m.data[10] = z2
      m.data[11] = 0.0
      m.data[12] = -(x0 * eyex + x1 * eyey + x2 * eyez)
      m.data[13] = -(y0 * eyex + y1 * eyey + y2 * eyez)
      m.data[14] = -(z0 * eyex + z1 * eyey + z2 * eyez)
      m.data[15] = 1.0
      m
    } else {
      Mat4::identity()
    }
  } else {
    Mat4::identity()
  }
}

/// Factory methods for common transformations
pub fn from_translation(v : Vec3) -> Mat4 {
  let m = Mat4::identity()
  m.data[12] = v.x
  m.data[13] = v.y
  m.data[14] = v.z
  m
}

pub fn from_scale(v : Vec3) -> Mat4 {
  let m = Mat4::identity()
  m.data[0] = v.x
  m.data[5] = v.y
  m.data[10] = v.z
  m
}

pub fn from_rotation(angle : Double, axis : Vec3) -> Mat4 {
  Mat4::identity().rotate_mut(angle, axis)
}

/// Operator overloading
pub fn op_mul(self : Mat4, other : Mat4) -> Mat4 {
  self.multiply(other)
}

/// String representation for debugging
pub fn to_string(self : Mat4) -> String {
  let d = self.data
  "Mat4(\n" +
  "  [" + d[0].to_string() + ", " + d[4].to_string() + ", " + d[8].to_string() + ", " + d[12].to_string() + "]\n" +
  "  [" + d[1].to_string() + ", " + d[5].to_string() + ", " + d[9].to_string() + ", " + d[13].to_string() + "]\n" +
  "  [" + d[2].to_string() + ", " + d[6].to_string() + ", " + d[10].to_string() + ", " + d[14].to_string() + "]\n" +
  "  [" + d[3].to_string() + ", " + d[7].to_string() + ", " + d[11].to_string() + ", " + d[15].to_string() + "]\n" +
  ")"
}

/// Tests
test "Mat4 constructors" {
  let m1 = Mat4::identity()
  assert_eq!(m1.get(0, 0), 1.0)
  assert_eq!(m1.get(1, 1), 1.0)
  assert_eq!(m1.get(2, 2), 1.0)
  assert_eq!(m1.get(3, 3), 1.0)
  assert_eq!(m1.get(0, 1), 0.0)
  assert_eq!(m1.get(1, 0), 0.0)
  
  let m2 = Mat4::zero()
  for i in 0..4 {
    for j in 0..4 {
      assert_eq!(m2.get(i, j), 0.0)
    }
  }
}

test "Mat4 multiply" {
  let m1 = from_scale(Vec3::new(2.0, 3.0, 4.0))
  let m2 = from_translation(Vec3::new(5.0, 6.0, 7.0))
  
  let result = m2.multiply(m1)  // First scale, then translate
  
  // Check that (1,1,1) transforms to (2*1+5, 3*1+6, 4*1+7) = (7, 9, 11)
  let transformed = transform_point(result, Vec3::new(1.0, 1.0, 1.0))
  assert_eq!(transformed.x, 7.0)
  assert_eq!(transformed.y, 9.0)
  assert_eq!(transformed.z, 11.0)
}

test "Mat4 transformations" {
  // Test translation
  let t = from_translation(Vec3::new(10.0, 20.0, 30.0))
  let p1 = transform_point(t, Vec3::new(5.0, 5.0, 5.0))
  assert_eq!(p1.x, 15.0)
  assert_eq!(p1.y, 25.0)
  assert_eq!(p1.z, 35.0)
  
  // Test scale
  let s = from_scale(Vec3::new(2.0, 3.0, 4.0))
  let p2 = transform_point(s, Vec3::new(5.0, 5.0, 5.0))
  assert_eq!(p2.x, 10.0)
  assert_eq!(p2.y, 15.0)
  assert_eq!(p2.z, 20.0)
  
  // Test rotation around Z axis (90 degrees)
  let r = from_rotation(radians_scalar(90.0), Vec3::new(0.0, 0.0, 1.0))
  let p3 = transform_point(r, Vec3::new(1.0, 0.0, 0.0))
  assert_true!((p3.x - 0.0).abs() < 0.0001)
  assert_true!((p3.y - 1.0).abs() < 0.0001)
  assert_true!((p3.z - 0.0).abs() < 0.0001)
}

test "Mat4 perspective" {
  let p = Mat4::perspective(radians_scalar(45.0), 1.33, 0.1, 1000.0)
  
  // Test that perspective matrix has expected structure
  assert_true!(p.get(0, 0) > 0.0)  // Focal length X
  assert_true!(p.get(1, 1) > 0.0)  // Focal length Y
  assert_eq!(p.get(3, 2), -1.0)       // Perspective divide
  assert_eq!(p.get(3, 3), 0.0)        // Bottom right should be 0
}

test "Mat4 inverse" {
  let m = Mat4::from_values(
    1.0, 0.0, 0.0, 0.0,
    0.0, 2.0, 0.0, 0.0,
    0.0, 0.0, 3.0, 0.0,
    4.0, 5.0, 6.0, 1.0
  )
  
  match m.inverse() {
    Some(inv) => {
      let identity = m.multiply(inv)
      // Check diagonal elements are ~1
      for i in 0..4 {
        assert_true!((identity.get(i, i) - 1.0).abs() < 0.0001)
      }
      // Check off-diagonal elements are ~0
      for i in 0..4 {
        for j in 0..4 {
          if i != j {
            assert_true!(identity.get(i, j).abs() < 0.0001)
          }
        }
      }
    }
    None => panic("Matrix should be invertible")
  }
}