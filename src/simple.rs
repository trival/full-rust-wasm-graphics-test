use trivalibs::math::transform::Transform;
use trivalibs::painter::prelude::*;
use trivalibs::painter::app::Event;
use trivalibs::rendering::camera::{CamProps, PerspectiveCamera};
use trivalibs::rendering::scene::SceneObject;
use trivalibs::{map, prelude::*};

const VERTICES: &[Vec3] = &[vec3(0.0, 5.0, 0.0), vec3(-2.5, 0., 0.0), vec3(2.5, 0., 0.0)];

#[derive(Debug, Clone)]
pub struct ColorEvent {
    pub r: f32,
    pub g: f32,
    pub b: f32,
}

pub struct SimpleApp {
    cam: PerspectiveCamera,
    transform: Transform,
    model_mat: BindingBuffer<Mat4>,
    vp_mat: BindingBuffer<Mat4>,
    color: BindingBuffer<Vec4>,

    canvas: Layer,
}


impl CanvasApp<ColorEvent> for SimpleApp {
    fn init(p: &mut Painter) -> Self {
        let shade = p
            .shade(&[Float32x3])
            .with_bindings(&[
                BINDING_BUFFER_VERT,
                BINDING_BUFFER_VERT,
                BINDING_BUFFER_FRAG,
            ])
            .create();
        load_vertex_shader!(shade, p, "./shader/vertex.spv");
        load_fragment_shader!(shade, p, "./shader/fragment.spv");

        let form = p.form(VERTICES).create();

        let model_mat = p.bind_mat4();
        let cam = p.bind_mat4();

        let color = p.bind_vec4();
        color.update(p, vec4(1.0, 0.0, 0.0, 1.0)); // Initialize with red
        
        let shape = p
            .shape(form, shade)
            .with_bindings(map! {
                0 => cam.binding(),
                1 => model_mat.binding(),
                2 => color.binding(),
            })
            .with_cull_mode(None)
            .create();

        let canvas = p
            .layer()
            .with_shape(shape)
            .with_clear_color(wgpu::Color::BLACK)
            .with_multisampling()
            .create();

        let transform =
            Transform::from_translation(vec3(0.0, -20.0, 0.0)).with_scale(Vec3::splat(8.0));

        Self {
            cam: PerspectiveCamera::create(CamProps {
                fov: Some(0.6),
                translation: Some(vec3(0.0, 0.0, 80.0)),
                ..default()
            }),
            transform,
            model_mat,
            vp_mat: cam,
            color,

            canvas,
        }
    }

    fn resize(&mut self, p: &mut Painter, width: u32, height: u32) {
        self.cam.set_aspect_ratio(width as f32 / height as f32);

        self.vp_mat.update(p, self.cam.view_proj_mat());
    }

    fn update(&mut self, p: &mut Painter, tpf: f32) {
        self.transform.rotate_y(tpf * 0.5);
        self.model_mat.update(p, self.transform.model_mat());
    }

    fn render(&self, p: &mut Painter) -> Result<(), SurfaceError> {
        p.request_next_frame();
        p.paint_and_show(self.canvas)
    }

    fn event(&mut self, e: Event<ColorEvent>, p: &mut Painter) {
        match e {
            Event::UserEvent(ColorEvent { r, g, b }) => {
                self.color.update(p, vec4(r, g, b, 1.0));
                p.request_next_frame();
            }
            _ => {}
        }
    }
}
