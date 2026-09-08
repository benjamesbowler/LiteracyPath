// Game-owned KayKit source records and deterministic renderer contract.
// Models are contact-corrected in native units. Apply scale once to the model root.
// Animate steering on Y and rolling on X using distance / (radius * scale).
// Chassis lean is independent of wheel contact pivots. Share one texture per atlasId.
export const SOUND_RACER_SCENE_KIT = {
  "assets": {
    "hero": {
      "url": "/game-assets/sound-racer/models/hero.glb",
      "atlasId": "city",
      "height": 1.25,
      "scale": 3.3896997771235933,
      "nativeHeight": 0.3687642216682434,
      "contactOffset": 0,
      "bounds": {
        "min": [
          -0.20947551727294922,
          0,
          -0.39533495903015137
        ],
        "max": [
          0.20948536694049835,
          0.3687642216682434,
          0.4107379913330078
        ]
      },
      "forwardAxis": "+z",
      "bytes": 59124,
      "sha256": "1d1b61235be4d482df85210821f45128e2852e76e23a2a1826da6972a1cdbdce",
      "source": {
        "creator": "Kay Lousberg",
        "license": "CC0-1.0",
        "sourceUrl": "https://github.com/KayKit-Game-Assets/KayKit-City-Builder-Bits-1.0",
        "revision": "63976910ca04d16f0fc531b9c614244be8128713",
        "dependencies": [
          {
            "path": "city/models/car_hatchback.gltf",
            "bytes": 10952,
            "sha256": "e38be3dbdfbc95b0e794fc5c8164b2ff658b2dc5049b51d38179d16a9432b4f3",
            "upstreamPath": "addons/kaykit_city_builder_bits/Assets/gltf/car_hatchback.gltf",
            "gitBlobSha": "0a01d2ab394731ae5d568cb607f8b880d5be4478"
          },
          {
            "path": "city/models/car_hatchback.bin",
            "bytes": 53564,
            "sha256": "e7756d8a44553ef75091bb4baa41388bcb1a1b44388008a3e670d05cb12f4c5f",
            "upstreamPath": "addons/kaykit_city_builder_bits/Assets/gltf/car_hatchback.bin",
            "gitBlobSha": "bc3fab7c8cf250a7c016765713aaa587ce42dcca"
          },
          {
            "path": "city/models/citybits_texture.png",
            "bytes": 19885,
            "sha256": "6d2d9a5a13bce32209cd8c04572ab170504d68f34b1519165c9b0c41871e235b",
            "upstreamPath": "addons/kaykit_city_builder_bits/Assets/fbx(unity)/citybits_texture.png",
            "gitBlobSha": "ffffc8998d30b32bdfa6761f33c87bcdfd0ba07f"
          }
        ]
      },
      "modifications": "Binary packaging; shared atlas URI; ground-contact root; vehicle chassis and steer/roll pivots where applicable.",
      "wheels": [
        {
          "position": "front_left",
          "steerNode": "wheel_steer_front_left",
          "rollNode": "wheel_roll_front_left",
          "meshNode": "car_hatchback_wheel_front_left",
          "radius": 0.07229961827397346,
          "steers": true,
          "axle": "x",
          "steerAxis": "y"
        },
        {
          "position": "front_right",
          "steerNode": "wheel_steer_front_right",
          "rollNode": "wheel_roll_front_right",
          "meshNode": "car_hatchback_wheel_front_right",
          "radius": 0.07229961827397346,
          "steers": true,
          "axle": "x",
          "steerAxis": "y"
        },
        {
          "position": "rear_left",
          "steerNode": "wheel_steer_rear_left",
          "rollNode": "wheel_roll_rear_left",
          "meshNode": "car_hatchback_wheel_rear_left",
          "radius": 0.07229961827397346,
          "steers": false,
          "axle": "x",
          "steerAxis": "y"
        },
        {
          "position": "rear_right",
          "steerNode": "wheel_steer_rear_right",
          "rollNode": "wheel_roll_rear_right",
          "meshNode": "car_hatchback_wheel_rear_right",
          "radius": 0.07229961827397346,
          "steers": false,
          "axle": "x",
          "steerAxis": "y"
        }
      ],
      "chassisNode": "chassis"
    },
    "rival": {
      "url": "/game-assets/sound-racer/models/rival.glb",
      "atlasId": "city",
      "height": 1.25,
      "scale": 3.3896997771235933,
      "nativeHeight": 0.3687642216682434,
      "contactOffset": 0,
      "bounds": {
        "min": [
          -0.20947551727294922,
          0,
          -0.47233495116233826
        ],
        "max": [
          0.20948536694049835,
          0.3687642216682434,
          0.4657380282878876
        ]
      },
      "forwardAxis": "+z",
      "bytes": 60876,
      "sha256": "a3432249949efd52b1b9838a8037b1e056b9a0079c7b68e96c6773f3aac99c40",
      "source": {
        "creator": "Kay Lousberg",
        "license": "CC0-1.0",
        "sourceUrl": "https://github.com/KayKit-Game-Assets/KayKit-City-Builder-Bits-1.0",
        "revision": "63976910ca04d16f0fc531b9c614244be8128713",
        "dependencies": [
          {
            "path": "city/models/car_sedan.gltf",
            "bytes": 10928,
            "sha256": "96c9d38e682bc2c77470af09d1a7450208559ca652bf2cf6fd2bc20b8646ef59",
            "upstreamPath": "addons/kaykit_city_builder_bits/Assets/gltf/car_sedan.gltf",
            "gitBlobSha": "8e1439b3357ba9ffa021406533979734137aecc2"
          },
          {
            "path": "city/models/car_sedan.bin",
            "bytes": 55332,
            "sha256": "1d69e7f098a5456a8c6891c4fd718ad1c71397045c8931817550a8801f00338d",
            "upstreamPath": "addons/kaykit_city_builder_bits/Assets/gltf/car_sedan.bin",
            "gitBlobSha": "ba412b85495e0a56947635821056eb8c273cf3da"
          },
          {
            "path": "city/models/citybits_texture.png",
            "bytes": 19885,
            "sha256": "6d2d9a5a13bce32209cd8c04572ab170504d68f34b1519165c9b0c41871e235b",
            "upstreamPath": "addons/kaykit_city_builder_bits/Assets/fbx(unity)/citybits_texture.png",
            "gitBlobSha": "ffffc8998d30b32bdfa6761f33c87bcdfd0ba07f"
          }
        ]
      },
      "modifications": "Binary packaging; shared atlas URI; ground-contact root; vehicle chassis and steer/roll pivots where applicable.",
      "wheels": [
        {
          "position": "front_left",
          "steerNode": "wheel_steer_front_left",
          "rollNode": "wheel_roll_front_left",
          "meshNode": "car_sedan_wheel_front_left",
          "radius": 0.07229961827397346,
          "steers": true,
          "axle": "x",
          "steerAxis": "y"
        },
        {
          "position": "front_right",
          "steerNode": "wheel_steer_front_right",
          "rollNode": "wheel_roll_front_right",
          "meshNode": "car_sedan_wheel_front_right",
          "radius": 0.07229961827397346,
          "steers": true,
          "axle": "x",
          "steerAxis": "y"
        },
        {
          "position": "rear_left",
          "steerNode": "wheel_steer_rear_left",
          "rollNode": "wheel_roll_rear_left",
          "meshNode": "car_sedan_wheel_rear_left",
          "radius": 0.07229961827397346,
          "steers": false,
          "axle": "x",
          "steerAxis": "y"
        },
        {
          "position": "rear_right",
          "steerNode": "wheel_steer_rear_right",
          "rollNode": "wheel_roll_rear_right",
          "meshNode": "car_sedan_wheel_rear_right",
          "radius": 0.07229961827397346,
          "steers": false,
          "axle": "x",
          "steerAxis": "y"
        }
      ],
      "chassisNode": "chassis"
    },
    "houseA": {
      "url": "/game-assets/sound-racer/models/houseA.glb",
      "atlasId": "city",
      "height": 6,
      "scale": 3.870794264840466,
      "nativeHeight": 1.5500694662332535,
      "contactOffset": 0,
      "bounds": {
        "min": [
          -0.6033698320388794,
          0,
          -0.6499999761581421
        ],
        "max": [
          0.6033698320388794,
          1.5500694662332535,
          0.8000000715255737
        ]
      },
      "forwardAxis": "+z",
      "bytes": 30664,
      "sha256": "56b34b78bdb9755596a5e2e9fd69087cb74b5dca309079237b17d5e2d514e63f",
      "source": {
        "creator": "Kay Lousberg",
        "license": "CC0-1.0",
        "sourceUrl": "https://github.com/KayKit-Game-Assets/KayKit-City-Builder-Bits-1.0",
        "revision": "63976910ca04d16f0fc531b9c614244be8128713",
        "dependencies": [
          {
            "path": "city/models/building_A_withoutBase.gltf",
            "bytes": 3083,
            "sha256": "37389d47e4ddec9175c40d41a48e2c1d16a1c44146833ec73fef2710e0b6876e",
            "upstreamPath": "addons/kaykit_city_builder_bits/Assets/gltf/building_A_withoutBase.gltf",
            "gitBlobSha": "dc14b26f831eab7be10fe18e24e0aa0caccfe3f5"
          },
          {
            "path": "city/models/building_A_withoutBase.bin",
            "bytes": 28820,
            "sha256": "a0446a10d14c50267c3fa6be98104e8467171b57f288448a5d740e91666d5056",
            "upstreamPath": "addons/kaykit_city_builder_bits/Assets/gltf/building_A_withoutBase.bin",
            "gitBlobSha": "6dda292475d096b2c42a3dd3da0fc9aea063c667"
          },
          {
            "path": "city/models/citybits_texture.png",
            "bytes": 19885,
            "sha256": "6d2d9a5a13bce32209cd8c04572ab170504d68f34b1519165c9b0c41871e235b",
            "upstreamPath": "addons/kaykit_city_builder_bits/Assets/fbx(unity)/citybits_texture.png",
            "gitBlobSha": "ffffc8998d30b32bdfa6761f33c87bcdfd0ba07f"
          }
        ]
      },
      "modifications": "Binary packaging; shared atlas URI; ground-contact root; vehicle chassis and steer/roll pivots where applicable."
    },
    "houseB": {
      "url": "/game-assets/sound-racer/models/houseB.glb",
      "atlasId": "city",
      "height": 7,
      "scale": 4.515926642313877,
      "nativeHeight": 1.5500694662332535,
      "contactOffset": 0,
      "bounds": {
        "min": [
          -0.8033698201179504,
          0,
          -0.6499999761581421
        ],
        "max": [
          0.8033698201179504,
          1.5500694662332535,
          0.6499999761581421
        ]
      },
      "forwardAxis": "+z",
      "bytes": 40692,
      "sha256": "e34eb18b8f34f9fa64baace5a90885173842ae0549702920ecc130f6d7f504b4",
      "source": {
        "creator": "Kay Lousberg",
        "license": "CC0-1.0",
        "sourceUrl": "https://github.com/KayKit-Game-Assets/KayKit-City-Builder-Bits-1.0",
        "revision": "63976910ca04d16f0fc531b9c614244be8128713",
        "dependencies": [
          {
            "path": "city/models/building_B_withoutBase.gltf",
            "bytes": 3089,
            "sha256": "69b1e3d91479c8fe3134e385fef567603cecd2423a032f2a11b9f2deb7046458",
            "upstreamPath": "addons/kaykit_city_builder_bits/Assets/gltf/building_B_withoutBase.gltf",
            "gitBlobSha": "c7081043ff943e9bb6c67a8f54697d402dcb9ac5"
          },
          {
            "path": "city/models/building_B_withoutBase.bin",
            "bytes": 38844,
            "sha256": "1fca25dd4b645058d55b069bbddc41fda2eea543a762237ed054f15bccbee34a",
            "upstreamPath": "addons/kaykit_city_builder_bits/Assets/gltf/building_B_withoutBase.bin",
            "gitBlobSha": "dacd24dde33924add6bd1052e3b78beee4fa879a"
          },
          {
            "path": "city/models/citybits_texture.png",
            "bytes": 19885,
            "sha256": "6d2d9a5a13bce32209cd8c04572ab170504d68f34b1519165c9b0c41871e235b",
            "upstreamPath": "addons/kaykit_city_builder_bits/Assets/fbx(unity)/citybits_texture.png",
            "gitBlobSha": "ffffc8998d30b32bdfa6761f33c87bcdfd0ba07f"
          }
        ]
      },
      "modifications": "Binary packaging; shared atlas URI; ground-contact root; vehicle chassis and steer/roll pivots where applicable."
    },
    "lamp": {
      "url": "/game-assets/sound-racer/models/lamp.glb",
      "atlasId": "city",
      "height": 3.5,
      "scale": 3.6461568315463717,
      "nativeHeight": 0.9599148258566856,
      "contactOffset": 0,
      "bounds": {
        "min": [
          -0.2392103672027588,
          0,
          -0.034511469304561615
        ],
        "max": [
          0.030096590518951416,
          0.9599148258566856,
          0.0345110222697258
        ]
      },
      "forwardAxis": "+z",
      "bytes": 8972,
      "sha256": "c418da5517b495c8490fc82012bb2df140424c78fcfab9256ff7609eea05af63",
      "source": {
        "creator": "Kay Lousberg",
        "license": "CC0-1.0",
        "sourceUrl": "https://github.com/KayKit-Game-Assets/KayKit-City-Builder-Bits-1.0",
        "revision": "63976910ca04d16f0fc531b9c614244be8128713",
        "dependencies": [
          {
            "path": "city/models/streetlight.gltf",
            "bytes": 3067,
            "sha256": "4399e9023844319e0f74311779a2c0ebecacec16f5dfd8123b6141a3af903c6a",
            "upstreamPath": "addons/kaykit_city_builder_bits/Assets/gltf/streetlight.gltf",
            "gitBlobSha": "0a35577350736d1c3e30fd68caba0a21c1a4168a"
          },
          {
            "path": "city/models/streetlight.bin",
            "bytes": 7136,
            "sha256": "2e95833194e4cccbf00a413187cc54ede953c047f88b7cc7b1bef1a1d0aea9a1",
            "upstreamPath": "addons/kaykit_city_builder_bits/Assets/gltf/streetlight.bin",
            "gitBlobSha": "0fa33cc8584b11fbdd8c83484d84a32830fc0e0a"
          },
          {
            "path": "city/models/citybits_texture.png",
            "bytes": 19885,
            "sha256": "6d2d9a5a13bce32209cd8c04572ab170504d68f34b1519165c9b0c41871e235b",
            "upstreamPath": "addons/kaykit_city_builder_bits/Assets/fbx(unity)/citybits_texture.png",
            "gitBlobSha": "ffffc8998d30b32bdfa6761f33c87bcdfd0ba07f"
          }
        ]
      },
      "modifications": "Binary packaging; shared atlas URI; ground-contact root; vehicle chassis and steer/roll pivots where applicable."
    },
    "signal": {
      "url": "/game-assets/sound-racer/models/signal.glb",
      "atlasId": "city",
      "height": 3,
      "scale": 4.112485291202153,
      "nativeHeight": 0.7294858917593956,
      "contactOffset": 0,
      "bounds": {
        "min": [
          -0.13457560539245605,
          0,
          -0.03985767439007759
        ],
        "max": [
          0.0398561954498291,
          0.7294858917593956,
          0.11071021109819412
        ]
      },
      "forwardAxis": "+z",
      "bytes": 32512,
      "sha256": "59d9fdbb28b59c8206b6768fffa951a8351eaa20ee72d1686b158f4a20be9c9a",
      "source": {
        "creator": "Kay Lousberg",
        "license": "CC0-1.0",
        "sourceUrl": "https://github.com/KayKit-Game-Assets/KayKit-City-Builder-Bits-1.0",
        "revision": "63976910ca04d16f0fc531b9c614244be8128713",
        "dependencies": [
          {
            "path": "city/models/trafficlight_A.gltf",
            "bytes": 3079,
            "sha256": "4a22f6fc11fcafd61b2272e675a20437d3c69003ae63002980a903a215941b15",
            "upstreamPath": "addons/kaykit_city_builder_bits/Assets/gltf/trafficlight_A.gltf",
            "gitBlobSha": "e0c75d0582f31d13f6c62df545478f3c64c3df02"
          },
          {
            "path": "city/models/trafficlight_A.bin",
            "bytes": 30664,
            "sha256": "8d41a66bbf788f5fd78fce0841ca9741c39314e0d2ad701e5161bb09bd4e8c79",
            "upstreamPath": "addons/kaykit_city_builder_bits/Assets/gltf/trafficlight_A.bin",
            "gitBlobSha": "8b61e1c4058797f528c9c59f4b00bb46f8382c85"
          },
          {
            "path": "city/models/citybits_texture.png",
            "bytes": 19885,
            "sha256": "6d2d9a5a13bce32209cd8c04572ab170504d68f34b1519165c9b0c41871e235b",
            "upstreamPath": "addons/kaykit_city_builder_bits/Assets/fbx(unity)/citybits_texture.png",
            "gitBlobSha": "ffffc8998d30b32bdfa6761f33c87bcdfd0ba07f"
          }
        ]
      },
      "modifications": "Binary packaging; shared atlas URI; ground-contact root; vehicle chassis and steer/roll pivots where applicable."
    },
    "bush": {
      "url": "/game-assets/sound-racer/models/bush.glb",
      "atlasId": "city",
      "height": 0.7,
      "scale": 1.8395416077780442,
      "nativeHeight": 0.38052958250045776,
      "contactOffset": 0,
      "bounds": {
        "min": [
          -0.08946483582258224,
          0,
          -0.09955329447984695
        ],
        "max": [
          0.09989581257104874,
          0.38052958250045776,
          0.09954001754522324
        ]
      },
      "forwardAxis": "+z",
      "bytes": 4832,
      "sha256": "a7dd062897f61e0feab2b240c0cada15191c0b119a1d5e315b1882b20b6ad6a1",
      "source": {
        "creator": "Kay Lousberg",
        "license": "CC0-1.0",
        "sourceUrl": "https://github.com/KayKit-Game-Assets/KayKit-City-Builder-Bits-1.0",
        "revision": "63976910ca04d16f0fc531b9c614244be8128713",
        "dependencies": [
          {
            "path": "city/models/bush.gltf",
            "bytes": 3022,
            "sha256": "b1de478b23e6bcfd08d6c070440582195839f66dfd3afc123118fb6298483183",
            "upstreamPath": "addons/kaykit_city_builder_bits/Assets/gltf/bush.gltf",
            "gitBlobSha": "9de86fe3219a8ac27fe0ddc3e534ed509ebfd753"
          },
          {
            "path": "city/models/bush.bin",
            "bytes": 3056,
            "sha256": "6b00a80ec23cdd55dd1398d648b51f1cf7eb4263cea61d3bf1dc24cc7c171b3e",
            "upstreamPath": "addons/kaykit_city_builder_bits/Assets/gltf/bush.bin",
            "gitBlobSha": "911f09225654a17c006857bd8469c6f06e536ba8"
          },
          {
            "path": "city/models/citybits_texture.png",
            "bytes": 19885,
            "sha256": "6d2d9a5a13bce32209cd8c04572ab170504d68f34b1519165c9b0c41871e235b",
            "upstreamPath": "addons/kaykit_city_builder_bits/Assets/fbx(unity)/citybits_texture.png",
            "gitBlobSha": "ffffc8998d30b32bdfa6761f33c87bcdfd0ba07f"
          }
        ]
      },
      "modifications": "Binary packaging; shared atlas URI; ground-contact root; vehicle chassis and steer/roll pivots where applicable."
    },
    "bridge": {
      "url": "/game-assets/sound-racer/models/bridge.glb",
      "atlasId": "medieval",
      "height": 2.5,
      "scale": 2.0,
      "nativeHeight": 1.25,
      "contactOffset": 0,
      "bounds": {
        "min": [
          -0.6666644811630249,
          0,
          -0.9622503519058228
        ],
        "max": [
          0.6666667461395264,
          1.25,
          0.9622492790222168
        ]
      },
      "forwardAxis": "+z",
      "bytes": 27368,
      "sha256": "d778ede32cfe40d90bef2cebf564fa2992649c596219e795ae0f26a3205363a9",
      "source": {
        "creator": "Kay Lousberg",
        "license": "CC0-1.0",
        "sourceUrl": "https://github.com/KayKit-Game-Assets/KayKit-Medieval-Hexagon-Pack-1.0",
        "revision": "84fa4e91af6a88989be7c99e0891cede11f2ca38",
        "dependencies": [
          {
            "path": "medieval/models/buildings/neutral/building_bridge_A.gltf",
            "bytes": 3039,
            "sha256": "7f3a7e8b3e72a66dec70d6a00eb87e62d3ca5c6892b9b965c675cb9d193e4d29",
            "upstreamPath": "addons/kaykit_medieval_hexagon_pack/Assets/gltf/buildings/neutral/building_bridge_A.gltf",
            "gitBlobSha": "df1ed184db0f1f8aade09280fd52017ff6fa3d6b"
          },
          {
            "path": "medieval/models/buildings/neutral/building_bridge_A.bin",
            "bytes": 25576,
            "sha256": "dc78350862e173e7d948dab4dbb3e32234f3ab2302a149da8d0c0da9380040d5",
            "upstreamPath": "addons/kaykit_medieval_hexagon_pack/Assets/gltf/buildings/neutral/building_bridge_A.bin",
            "gitBlobSha": "e069007b0a5ed7a05924353be9f591fe48032fe7"
          },
          {
            "path": "medieval/models/buildings/neutral/hexagons_medieval.png",
            "bytes": 15783,
            "sha256": "5301a06866ba3be68dcc14cc429bd6d0f69004b72884283715d7e233f2e9782e",
            "upstreamPath": "addons/kaykit_medieval_hexagon_pack/Assets/fbx(unity)/buildings/blue/hexagons_medieval.png",
            "gitBlobSha": "14cdc253646e4dba3cb7a267a6f7399b78ba2231"
          }
        ]
      },
      "modifications": "Binary packaging; shared atlas URI; ground-contact root; vehicle chassis and steer/roll pivots where applicable."
    },
    "treeA": {
      "url": "/game-assets/sound-racer/models/treeA.glb",
      "atlasId": "medieval",
      "height": 4,
      "scale": 3.343227277375346,
      "nativeHeight": 1.1964487209916115,
      "contactOffset": 0,
      "bounds": {
        "min": [
          -0.28753381967544556,
          0,
          -0.30171626806259155
        ],
        "max": [
          0.28644031286239624,
          1.1964487209916115,
          0.2452930510044098
        ]
      },
      "forwardAxis": "+z",
      "bytes": 5164,
      "sha256": "2ec0fac952820c528e4224b3ee92a7d586dc064eb9892f0ec5d36eb728c1a7bf",
      "source": {
        "creator": "Kay Lousberg",
        "license": "CC0-1.0",
        "sourceUrl": "https://github.com/KayKit-Game-Assets/KayKit-Medieval-Hexagon-Pack-1.0",
        "revision": "84fa4e91af6a88989be7c99e0891cede11f2ca38",
        "dependencies": [
          {
            "path": "medieval/models/decoration/nature/tree_single_A.gltf",
            "bytes": 3053,
            "sha256": "ac913af6eaed6f15d26a2b75a877aa8dd10de90f26298f3f953abad86a4b4606",
            "upstreamPath": "addons/kaykit_medieval_hexagon_pack/Assets/gltf/decoration/nature/tree_single_A.gltf",
            "gitBlobSha": "0c230093dab0c16d5dd65974917fd95bd119eb04"
          },
          {
            "path": "medieval/models/decoration/nature/tree_single_A.bin",
            "bytes": 3340,
            "sha256": "437deac68f35338bb309b01e4d346dd4be37557d7a2f033d04765f63e1b88825",
            "upstreamPath": "addons/kaykit_medieval_hexagon_pack/Assets/gltf/decoration/nature/tree_single_A.bin",
            "gitBlobSha": "a3baf092cbc2c649bbfc40b9ffe81d6b27dd60ea"
          },
          {
            "path": "medieval/models/decoration/nature/hexagons_medieval.png",
            "bytes": 15783,
            "sha256": "5301a06866ba3be68dcc14cc429bd6d0f69004b72884283715d7e233f2e9782e",
            "upstreamPath": "addons/kaykit_medieval_hexagon_pack/Assets/fbx(unity)/buildings/blue/hexagons_medieval.png",
            "gitBlobSha": "14cdc253646e4dba3cb7a267a6f7399b78ba2231"
          }
        ]
      },
      "modifications": "Binary packaging; shared atlas URI; ground-contact root; vehicle chassis and steer/roll pivots where applicable."
    },
    "treeB": {
      "url": "/game-assets/sound-racer/models/treeB.glb",
      "atlasId": "medieval",
      "height": 4.5,
      "scale": 3.7107976109846876,
      "nativeHeight": 1.2126772925257683,
      "contactOffset": 0,
      "bounds": {
        "min": [
          -0.34244003891944885,
          0,
          -0.3600638508796692
        ],
        "max": [
          0.34244194626808167,
          1.2126772925257683,
          0.360063761472702
        ]
      },
      "forwardAxis": "+z",
      "bytes": 9196,
      "sha256": "317e5185d2b432e84bb17f94f44fa1baa38021358e63fc80b0fd8267fe679dbd",
      "source": {
        "creator": "Kay Lousberg",
        "license": "CC0-1.0",
        "sourceUrl": "https://github.com/KayKit-Game-Assets/KayKit-Medieval-Hexagon-Pack-1.0",
        "revision": "84fa4e91af6a88989be7c99e0891cede11f2ca38",
        "dependencies": [
          {
            "path": "medieval/models/decoration/nature/tree_single_B.gltf",
            "bytes": 3056,
            "sha256": "1c038591301947c485937e9fdbab182c813ef32df48c02fad3daeb2f1f0421e0",
            "upstreamPath": "addons/kaykit_medieval_hexagon_pack/Assets/gltf/decoration/nature/tree_single_B.gltf",
            "gitBlobSha": "174c5b4181ccf0e0c7d6cbf143bd5f0c6d9b4cd4"
          },
          {
            "path": "medieval/models/decoration/nature/tree_single_B.bin",
            "bytes": 7368,
            "sha256": "c6a7423ce62f61216f7d8c77e1bd1d8665cbbee59718e59e0e42485f9acfca36",
            "upstreamPath": "addons/kaykit_medieval_hexagon_pack/Assets/gltf/decoration/nature/tree_single_B.bin",
            "gitBlobSha": "e548757b12d728fbe86291e86521624eedb014c0"
          },
          {
            "path": "medieval/models/decoration/nature/hexagons_medieval.png",
            "bytes": 15783,
            "sha256": "5301a06866ba3be68dcc14cc429bd6d0f69004b72884283715d7e233f2e9782e",
            "upstreamPath": "addons/kaykit_medieval_hexagon_pack/Assets/fbx(unity)/buildings/blue/hexagons_medieval.png",
            "gitBlobSha": "14cdc253646e4dba3cb7a267a6f7399b78ba2231"
          }
        ]
      },
      "modifications": "Binary packaging; shared atlas URI; ground-contact root; vehicle chassis and steer/roll pivots where applicable."
    },
    "flag": {
      "url": "/game-assets/sound-racer/models/flag.glb",
      "atlasId": "medieval",
      "height": 2,
      "scale": 7.207971156456973,
      "nativeHeight": 0.27747058868408203,
      "contactOffset": 0,
      "bounds": {
        "min": [
          -0.027133483439683914,
          0,
          -0.24206775426864624
        ],
        "max": [
          0.027875661849975586,
          0.27747058868408203,
          0.02191011607646942
        ]
      },
      "forwardAxis": "+z",
      "bytes": 4244,
      "sha256": "895103324183dd244762b7c83e75e694c76617db1fa1d844a4331beb734407c1",
      "source": {
        "creator": "Kay Lousberg",
        "license": "CC0-1.0",
        "sourceUrl": "https://github.com/KayKit-Game-Assets/KayKit-Medieval-Hexagon-Pack-1.0",
        "revision": "84fa4e91af6a88989be7c99e0891cede11f2ca38",
        "dependencies": [
          {
            "path": "medieval/models/decoration/props/flag_green.gltf",
            "bytes": 3026,
            "sha256": "3d3192dc48ae58179391adc15d38faadcc1680e2d6b8bab582da054cf01c82bd",
            "upstreamPath": "addons/kaykit_medieval_hexagon_pack/Assets/gltf/decoration/props/flag_green.gltf",
            "gitBlobSha": "a18cc7c7d4144e2cf14cd4feb01fea49fbfbccf1"
          },
          {
            "path": "medieval/models/decoration/props/flag_green.bin",
            "bytes": 2464,
            "sha256": "76878b69c0a3a56d835018bb3d3a489d0ae6ddd425e4b67ee5c27c4a445fc10f",
            "upstreamPath": "addons/kaykit_medieval_hexagon_pack/Assets/gltf/decoration/props/flag_green.bin",
            "gitBlobSha": "0a4820942f9cf235844fff26e864f4da0df6b265"
          },
          {
            "path": "medieval/models/decoration/props/hexagons_medieval.png",
            "bytes": 15783,
            "sha256": "5301a06866ba3be68dcc14cc429bd6d0f69004b72884283715d7e233f2e9782e",
            "upstreamPath": "addons/kaykit_medieval_hexagon_pack/Assets/fbx(unity)/buildings/blue/hexagons_medieval.png",
            "gitBlobSha": "14cdc253646e4dba3cb7a267a6f7399b78ba2231"
          }
        ]
      },
      "modifications": "Binary packaging; shared atlas URI; ground-contact root; vehicle chassis and steer/roll pivots where applicable."
    }
  },
  "atlases": {
    "city": {
      "url": "/game-assets/sound-racer/textures/city.png",
      "bytes": 19885,
      "sha256": "6d2d9a5a13bce32209cd8c04572ab170504d68f34b1519165c9b0c41871e235b"
    },
    "medieval": {
      "url": "/game-assets/sound-racer/textures/medieval.png",
      "bytes": 15783,
      "sha256": "5301a06866ba3be68dcc14cc429bd6d0f69004b72884283715d7e233f2e9782e"
    }
  },
  "sharedAtlasUrls": {
    "city": "/game-assets/sound-racer/textures/city.png",
    "medieval": "/game-assets/sound-racer/textures/medieval.png"
  },
  "driver": {
    "id": "muddy",
    "name": "Muddy",
    "image": "/images/companions/muddy.webp"
  },
  "packs": {
    "city": {
      "creator": "Kay Lousberg",
      "license": "CC0-1.0",
      "sourceUrl": "https://github.com/KayKit-Game-Assets/KayKit-City-Builder-Bits-1.0",
      "revision": "63976910ca04d16f0fc531b9c614244be8128713",
      "upstreamLicenseSha256": "b076d86beec660e1550e00796ca24a8b70d7b2187d79954b2e29722b666dce93",
      "licenseModifications": "none",
      "licenseSha256": "b076d86beec660e1550e00796ca24a8b70d7b2187d79954b2e29722b666dce93",
      "licenseUrl": "/game-assets/sound-racer/licenses/kaykit-city.txt"
    },
    "medieval": {
      "creator": "Kay Lousberg",
      "license": "CC0-1.0",
      "sourceUrl": "https://github.com/KayKit-Game-Assets/KayKit-Medieval-Hexagon-Pack-1.0",
      "revision": "84fa4e91af6a88989be7c99e0891cede11f2ca38",
      "upstreamLicenseSha256": "881e50d3629fba90629bedc65e9e6f47cfab3609598c296dcb7f70ea83174360",
      "licenseModifications": "Trimmed trailing line whitespace and added final newline; licence wording unchanged.",
      "licenseSha256": "893a2b22391f4589070ba416f2cdb11bc5f54ad9a543d4f59f6d22b19072f39c",
      "licenseUrl": "/game-assets/sound-racer/licenses/kaykit-medieval.txt"
    }
  },
  "modelBytes": 283644,
  "textureBytes": 35668,
  "closureBytes": 319312
};

export function getSoundRacerAssetUrls() {
  return Object.values(SOUND_RACER_SCENE_KIT.assets).map(({ url }) => url);
}
