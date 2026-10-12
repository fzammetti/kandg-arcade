/**
 * The asset manifest: the names of every image and every sound the game uses.
 *
 * The names are exactly the original PocketPC file names with the extension removed, and the same name is used as
 * the Phaser key the asset is loaded under.  Images are loaded from img/<name>.png, sounds from sfx/<name>.mp3,
 * cut scene scripts from scripts/<name>.oss, maps from maps/<name>.map, the captives' conversations from
 * character_interactions/<name>.cid and other data from data/<name>.dat (see PreloadScene.js).
 *
 * In the original C++ source every asset was referred to by a resource ID such as GFX_MENU_TOP or
 * SFX_MUSIC_THEME, and the matching file was nearly always the same name in lower case (gfx_menu_top.png,
 * sfx_music_theme.wav).  So, to find the asset for a resource ID seen in the original code, lower-case it.
 *
 * BEWARE: there are 19 exceptions, where the resource ID and the file name do not match.  They are listed here
 * (taken from the original game.rc file) because getting one wrong shows the wrong picture or plays the wrong
 * sound, and two of them are actually swapped:
 *
 *   FNT_FONT1                              -> font1
 *   FNT_FONT1_GREEN                        -> font1_green
 *   GFX_VIRUS_SYMBOL_0, _1, _2             -> gfx_virus_symbol_00, _01, _02
 *   GFX_VIRUS_SYMBOL_SELECTED_0, _1, _2    -> gfx_virus_symbol_selected_00, _01, _02
 *   GFX_CAPTIVE_FREDERICK_H_SMILEY_00, _01 -> gfx_captive_frederick_j_smiley_00, _01
 *   GFX_TILE_HEALTH                        -> gfx_health
 *   GFX_VIEWSCREEN_STATIC_1, _2, _3        -> gfx_viewscreen_static1, static2, static3
 *   GFX_HENRY_JUMPING_1                    -> gfx_henry_jumping_2   (swapped!)
 *   GFX_HENRY_JUMPING_2                    -> gfx_henry_jumping_1   (swapped!)
 *   SFX_TITLE_KRELMAC                      -> sfx_title_krelmac_ohgeez
 *   SFX_TITLE_GENTOO                       -> sfx_title_gentoo_bhahaha
 *   SFX_FFOPIR_SIRTET_PAEHC_LANDED_CLEARED -> sfx_ffopir_sirtet_paehc_landed_clear
 */


// Every image.  These have all been through img/convert_images.js, which added real transparency in place of the
// pink color key that the original game used.
const imageAssets = [
  `font1`, `font1_green`, `gfx_a_day_in_the_strife_background`, `gfx_a_day_in_the_strife_green_alien_00`,
  `gfx_a_day_in_the_strife_green_alien_01`, `gfx_a_day_in_the_strife_red_alien_00`,
  `gfx_a_day_in_the_strife_red_alien_01`, `gfx_a_day_in_the_strife_shield_00`, `gfx_a_day_in_the_strife_shield_01`,
  `gfx_a_day_in_the_strife_shield_02`, `gfx_a_day_in_the_strife_shield_03`, `gfx_a_day_in_the_strife_ship_00`,
  `gfx_a_day_in_the_strife_ship_01`, `gfx_a_day_in_the_strife_yellow_alien_00`,
  `gfx_a_day_in_the_strife_yellow_alien_01`, `gfx_alien_babble_alien_left`, `gfx_alien_babble_alien_still`,
  `gfx_alien_babble_arrow`, `gfx_alien_babble_background`, `gfx_alien_babble_box`, `gfx_alien_babble_target`,
  `gfx_antigravitator_gravpit_00`, `gfx_antigravitator_gravpit_01`, `gfx_antigravitator_gun`,
  `gfx_antigravitator_laser`, `gfx_antigravitator_ship_00`, `gfx_antigravitator_ship_01`, `gfx_antigravitator_ship_02`,
  `gfx_antigravitator_ship_03`, `gfx_antigravitator_ship_04`, `gfx_antigravitator_ship_05`,
  `gfx_captive_1_expression_1`, `gfx_captive_1_expression_2`, `gfx_captive_1_expression_3`,
  `gfx_captive_1_expression_4`, `gfx_captive_1_expression_5`, `gfx_captive_2_expression_1`,
  `gfx_captive_2_expression_2`, `gfx_captive_2_expression_3`, `gfx_captive_2_expression_4`,
  `gfx_captive_2_expression_5`, `gfx_captive_3_expression_1`, `gfx_captive_3_expression_2`,
  `gfx_captive_3_expression_3`, `gfx_captive_3_expression_4`, `gfx_captive_3_expression_5`,
  `gfx_captive_4_expression_1`, `gfx_captive_4_expression_2`, `gfx_captive_4_expression_3`,
  `gfx_captive_4_expression_4`, `gfx_captive_4_expression_5`, `gfx_captive_5_expression_1`,
  `gfx_captive_5_expression_2`, `gfx_captive_5_expression_3`, `gfx_captive_5_expression_4`,
  `gfx_captive_5_expression_5`, `gfx_captive_brenda_bubey_00`, `gfx_captive_brenda_bubey_01`, `gfx_captive_catrina_00`,
  `gfx_captive_catrina_01`, `gfx_captive_eeger_00`, `gfx_captive_eeger_01`, `gfx_captive_frederick_j_smiley_00`,
  `gfx_captive_frederick_j_smiley_01`, `gfx_captive_sully_00`, `gfx_captive_sully_01`, `gfx_conquerror_background`,
  `gfx_conquerror_building_1`, `gfx_conquerror_building_1_destroyed`, `gfx_conquerror_building_2`,
  `gfx_conquerror_building_2_destroyed`, `gfx_conquerror_building_3`, `gfx_conquerror_building_3_destroyed`,
  `gfx_conquerror_building_4`, `gfx_conquerror_building_4_destroyed`, `gfx_conquerror_gun_bottom`,
  `gfx_conquerror_gun_top`, `gfx_console_left`, `gfx_console_middle`, `gfx_console_right`, `gfx_copycat_symbol_00`,
  `gfx_copycat_symbol_01`, `gfx_copycat_symbol_02`, `gfx_copycat_symbol_03`, `gfx_copycat_symbol_highlight_00`,
  `gfx_copycat_symbol_highlight_01`, `gfx_copycat_symbol_highlight_02`, `gfx_copycat_symbol_highlight_03`,
  `gfx_cosmic_squirrel_acorn`, `gfx_cosmic_squirrel_alien_00`, `gfx_cosmic_squirrel_alien_01`,
  `gfx_cosmic_squirrel_comet_00`, `gfx_cosmic_squirrel_comet_01`, `gfx_cosmic_squirrel_squirrel_00`,
  `gfx_cosmic_squirrel_squirrel_01`, `gfx_deathtrap_background`, `gfx_deathtrap_player_dieing_00`,
  `gfx_deathtrap_player_dieing_01`, `gfx_deathtrap_player_jumping`, `gfx_deathtrap_player_standing`,
  `gfx_defendoh_alien_00`, `gfx_defendoh_alien_01`, `gfx_defendoh_landscape`, `gfx_defendoh_ship_00`,
  `gfx_defendoh_ship_01`, `gfx_divider_00`, `gfx_engineer_background`, `gfx_engineer_diverter_down_left`,
  `gfx_engineer_diverter_down_right`, `gfx_engineer_diverter_horizontal`, `gfx_engineer_diverter_up_left`,
  `gfx_engineer_diverter_up_right`, `gfx_engineer_diverter_vertical`, `gfx_engineer_nucleus_1`,
  `gfx_engineer_nucleus_2`, `gfx_engineer_nucleus_3`, `gfx_engineer_nucleus_4`, `gfx_engineer_nucleus_5`,
  `gfx_engineer_nucleus_6`, `gfx_engineer_nucleus_7`, `gfx_engineer_nucleus_8`, `gfx_engineer_particle1_00`,
  `gfx_engineer_particle1_01`, `gfx_engineer_particle2_00`, `gfx_engineer_particle2_01`, `gfx_engineer_particle3_00`,
  `gfx_engineer_particle3_01`, `gfx_engineer_particle4_00`, `gfx_engineer_particle4_01`, `gfx_explosion_00`,
  `gfx_explosion_01`, `gfx_explosion_02`, `gfx_explosion_03`, `gfx_explosion_04`, `gfx_far_out_fowl_background`,
  `gfx_far_out_fowl_catcher`, `gfx_far_out_fowl_chicken_00`, `gfx_far_out_fowl_chicken_01`, `gfx_far_out_fowl_egg`,
  `gfx_far_out_fowl_egg_splat`, `gfx_ffopir_sirtet_paehc_background`, `gfx_ffopir_sirtet_paehc_block`,
  `gfx_final_score_background`, `gfx_flight_of_doom_asteroid`, `gfx_flight_of_doom_ship`, `gfx_game_done_off`,
  `gfx_game_done_on`, `gfx_gentoo_01`, `gfx_gentoo_02`, `gfx_gentoo_03`, `gfx_gentoo_04`, `gfx_gentoo_05`,
  `gfx_gentoo_06`, `gfx_gentoo_07`, `gfx_gentoo_08`, `gfx_gentoo_09`, `gfx_get_ready`, `gfx_get_set`,
  `gfx_glutton_background`, `gfx_glutton_body`, `gfx_glutton_food`, `gfx_glutton_head`, `gfx_go`, `gfx_happy_burst`,
  `gfx_health`, `gfx_heart_1`, `gfx_heart_2`, `gfx_henry_beamingup_1`, `gfx_henry_beamingup_2`,
  `gfx_henry_beamingup_3`, `gfx_henry_beamingup_4`, `gfx_henry_beamingup_5`, `gfx_henry_captive_1`,
  `gfx_henry_captive_2`, `gfx_henry_captive_3`, `gfx_henry_captive_4`, `gfx_henry_dead_1`, `gfx_henry_dead_2`,
  `gfx_henry_dead_3`, `gfx_henry_jumping_1`, `gfx_henry_jumping_2`, `gfx_henry_wandering_1`, `gfx_henry_wandering_2`,
  `gfx_henry_wandering_3`, `gfx_henry_wandering_4`, `gfx_henry_wandering_5`, `gfx_henry_wandering_6`,
  `gfx_icon_adventure_game`, `gfx_icon_mini_game_melee`, `gfx_in_memoria_tile_picture_00`,
  `gfx_in_memoria_tile_picture_01`, `gfx_in_memoria_tile_picture_02`, `gfx_in_memoria_tile_picture_03`,
  `gfx_in_memoria_tile_picture_04`, `gfx_in_memoria_tile_picture_05`, `gfx_in_memoria_tile_picture_06`,
  `gfx_in_memoria_tile_picture_07`, `gfx_in_memoria_tile_picture_08`, `gfx_in_memoria_tile_picture_09`,
  `gfx_in_memoria_tile_picture_10`, `gfx_in_memoria_tile_picture_11`, `gfx_in_memoria_unflipped_tile_picture`,
  `gfx_ins_next_0`, `gfx_ins_next_1`, `gfx_ins_prev_0`, `gfx_ins_prev_1`, `gfx_krelmac_01`, `gfx_krelmac_02`,
  `gfx_krelmac_03`, `gfx_krelmac_04`, `gfx_krelmac_05`, `gfx_krelmac_06`, `gfx_krelmac_07`, `gfx_krelmac_08`,
  `gfx_krelmac_09`, `gfx_krelmac_10`, `gfx_krelmac_11`, `gfx_left_hand_dl`, `gfx_left_hand_down`, `gfx_left_hand_dr`,
  `gfx_left_hand_left`, `gfx_left_hand_normal`, `gfx_left_hand_right`, `gfx_left_hand_ul`, `gfx_left_hand_up`,
  `gfx_left_hand_ur`, `gfx_lepar_land_dead_lepar`, `gfx_lepar_land_lepar_00`, `gfx_lepar_land_lepar_01`,
  `gfx_lepar_land_mud`, `gfx_lepar_land_player_00`, `gfx_lepar_land_player_01`, `gfx_lepar_land_player_still`,
  `gfx_lepar_land_treasure`, `gfx_lepar_land_tree`, `gfx_lock`, `gfx_logo_crackhead`, `gfx_logo_omnytex`,
  `gfx_main_menu_background_tile`, `gfx_main_menu_title`, `gfx_menu_bottom`, `gfx_menu_continue_game_0`,
  `gfx_menu_continue_game_1`, `gfx_menu_credits_0`, `gfx_menu_credits_1`, `gfx_menu_high_scores_0`,
  `gfx_menu_high_scores_1`, `gfx_menu_instructions_0`, `gfx_menu_instructions_1`, `gfx_menu_new_game_0`,
  `gfx_menu_new_game_1`, `gfx_menu_options_0`, `gfx_menu_options_1`, `gfx_menu_quit_0`, `gfx_menu_quit_1`,
  `gfx_menu_top`, `gfx_mini_game_frame`, `gfx_mini_game_frame_l1`, `gfx_mini_game_frame_l2`, `gfx_mini_game_frame_l3`,
  `gfx_mini_game_frame_l4`, `gfx_mini_game_frame_l5`, `gfx_mini_game_frame_r1`, `gfx_mini_game_frame_r2`,
  `gfx_mini_game_frame_r3`, `gfx_mini_game_frame_r4`, `gfx_mini_game_frame_r5`, `gfx_missile_00`, `gfx_missile_01`,
  `gfx_muncher_dude_alien_00`, `gfx_muncher_dude_alien_01`, `gfx_muncher_dude_background`, `gfx_muncher_dude_pellet`,
  `gfx_muncher_dude_player_00`, `gfx_muncher_dude_player_01`, `gfx_player_walking_e_00`, `gfx_player_walking_e_01`,
  `gfx_player_walking_e_02`, `gfx_player_walking_n_00`, `gfx_player_walking_n_01`, `gfx_player_walking_n_02`,
  `gfx_player_walking_s_00`, `gfx_player_walking_s_01`, `gfx_player_walking_s_02`, `gfx_player_walking_w_00`,
  `gfx_player_walking_w_01`, `gfx_player_walking_w_02`, `gfx_popup_border`, `gfx_popup_border_big`,
  `gfx_refluxive_background`, `gfx_refluxive_bouncy`, `gfx_refluxive_paddle`, `gfx_reluctant_hero_background`,
  `gfx_reluctant_hero_person_00`, `gfx_reluctant_hero_person_01`, `gfx_reluctant_hero_player_00`,
  `gfx_reluctant_hero_player_01`, `gfx_right_hand_down`, `gfx_right_hand_up`, `gfx_robot_disappearing_appearing_00`,
  `gfx_robot_disappearing_appearing_01`, `gfx_robot_disappearing_appearing_02`, `gfx_robot_disappearing_appearing_03`,
  `gfx_robot_disappearing_appearing_04`, `gfx_robot_disappearing_appearing_05`, `gfx_robot_disappearing_appearing_06`,
  `gfx_robot_disappearing_appearing_07`, `gfx_robot_disappearing_appearing_08`, `gfx_robot_disappearing_appearing_09`,
  `gfx_robot_disappearing_appearing_10`, `gfx_robot_disappearing_appearing_11`, `gfx_robot_disappearing_appearing_12`,
  `gfx_robot_disappearing_appearing_13`, `gfx_robot_disappearing_appearing_14`, `gfx_robot_disappearing_appearing_15`,
  `gfx_robot_disappearing_appearing_16`, `gfx_robot_new_tile_appearing_00`, `gfx_robot_new_tile_appearing_01`,
  `gfx_robot_new_tile_appearing_02`, `gfx_robot_new_tile_appearing_03`, `gfx_robot_new_tile_appearing_04`,
  `gfx_robot_new_tile_appearing_05`, `gfx_robot_still_00`, `gfx_robot_still_01`, `gfx_robot_still_02`,
  `gfx_robot_still_03`, `gfx_robot_still_04`, `gfx_robot_still_05`, `gfx_robot_still_06`, `gfx_ship_interior`,
  `gfx_son_of_eliminator_down`, `gfx_son_of_eliminator_down_current`, `gfx_son_of_eliminator_empty`,
  `gfx_son_of_eliminator_empty_current`, `gfx_son_of_eliminator_up`, `gfx_son_of_eliminator_up_current`,
  `gfx_squishem_alien_00`, `gfx_squishem_alien_01`, `gfx_squishem_alien_02`, `gfx_squishem_alien_03`,
  `gfx_squishem_alien_04`, `gfx_squishem_alien_05`, `gfx_squishem_rayh_00`, `gfx_squishem_rayh_01`,
  `gfx_squishem_rayv_00`, `gfx_squishem_rayv_01`, `gfx_ss_a_day_in_the_strife`, `gfx_ss_alien_babble`,
  `gfx_ss_antigravitator`, `gfx_ss_conquerror`, `gfx_ss_copycat`, `gfx_ss_cosmic_squirrel`, `gfx_ss_deathtrap`,
  `gfx_ss_defendoh`, `gfx_ss_engineer`, `gfx_ss_far_out_fowl`, `gfx_ss_ffopir_sirtet_paehc`, `gfx_ss_flight_of_doom`,
  `gfx_ss_glutton`, `gfx_ss_in_memoria`, `gfx_ss_lepar_land`, `gfx_ss_muncher_dude`, `gfx_ss_refluxive`,
  `gfx_ss_reluctant_hero`, `gfx_ss_son_of_eliminator`, `gfx_ss_squishem`, `gfx_ss_the_bogaz_derby`,
  `gfx_ss_the_escape`, `gfx_ss_the_redeye_order`, `gfx_ss_trouble_in_line_world`, `gfx_ss_virus`, `gfx_status_bar`,
  `gfx_the_bogaz_derby_enemy_00`, `gfx_the_bogaz_derby_enemy_01`, `gfx_the_bogaz_derby_player_00`,
  `gfx_the_bogaz_derby_player_01`, `gfx_the_bogaz_derby_side`, `gfx_the_bogaz_derby_street`, `gfx_the_escape_destpad`,
  `gfx_the_escape_player_down`, `gfx_the_escape_player_left`, `gfx_the_escape_player_right`,
  `gfx_the_escape_player_still`, `gfx_the_escape_player_up`, `gfx_the_escape_rock`, `gfx_the_escape_rock_in_place`,
  `gfx_the_escape_wall`, `gfx_the_escape_wall_2`, `gfx_the_redeye_order_1`, `gfx_the_redeye_order_10`,
  `gfx_the_redeye_order_11`, `gfx_the_redeye_order_12`, `gfx_the_redeye_order_13`, `gfx_the_redeye_order_14`,
  `gfx_the_redeye_order_15`, `gfx_the_redeye_order_2`, `gfx_the_redeye_order_3`, `gfx_the_redeye_order_4`,
  `gfx_the_redeye_order_5`, `gfx_the_redeye_order_6`, `gfx_the_redeye_order_7`, `gfx_the_redeye_order_8`,
  `gfx_the_redeye_order_9`, `gfx_tile_console_00`, `gfx_tile_console_01`, `gfx_tile_level_1_floor_01`,
  `gfx_tile_level_1_wall_block`, `gfx_tile_level_1_wall_e`, `gfx_tile_level_1_wall_n`, `gfx_tile_level_1_wall_ne`,
  `gfx_tile_level_1_wall_nw`, `gfx_tile_level_1_wall_s`, `gfx_tile_level_1_wall_se`, `gfx_tile_level_1_wall_sw`,
  `gfx_tile_level_1_wall_w`, `gfx_tile_level_2_floor_01`, `gfx_tile_level_2_wall_block`, `gfx_tile_level_2_wall_e`,
  `gfx_tile_level_2_wall_n`, `gfx_tile_level_2_wall_ne`, `gfx_tile_level_2_wall_nw`, `gfx_tile_level_2_wall_s`,
  `gfx_tile_level_2_wall_se`, `gfx_tile_level_2_wall_sw`, `gfx_tile_level_2_wall_w`, `gfx_tile_level_3_floor_01`,
  `gfx_tile_level_3_wall_alone`, `gfx_tile_level_3_wall_block`, `gfx_tile_level_3_wall_e`, `gfx_tile_level_3_wall_n`,
  `gfx_tile_level_3_wall_ne`, `gfx_tile_level_3_wall_nw`, `gfx_tile_level_3_wall_s`, `gfx_tile_level_3_wall_se`,
  `gfx_tile_level_3_wall_sw`, `gfx_tile_level_3_wall_w`, `gfx_tile_level_4_floor_01`, `gfx_tile_level_4_wall_alone`,
  `gfx_tile_level_4_wall_block`, `gfx_tile_level_4_wall_e`, `gfx_tile_level_4_wall_n`, `gfx_tile_level_4_wall_ne`,
  `gfx_tile_level_4_wall_nw`, `gfx_tile_level_4_wall_s`, `gfx_tile_level_4_wall_se`, `gfx_tile_level_4_wall_sw`,
  `gfx_tile_level_4_wall_w`, `gfx_tile_level_5_floor_01`, `gfx_tile_level_5_wall_alone`, `gfx_tile_level_5_wall_block`,
  `gfx_tile_level_5_wall_e`, `gfx_tile_level_5_wall_e_tjoint`, `gfx_tile_level_5_wall_horizontal`,
  `gfx_tile_level_5_wall_n`, `gfx_tile_level_5_wall_n_tjoint`, `gfx_tile_level_5_wall_ne`, `gfx_tile_level_5_wall_nw`,
  `gfx_tile_level_5_wall_s`, `gfx_tile_level_5_wall_s_tjoint`, `gfx_tile_level_5_wall_se`, `gfx_tile_level_5_wall_sw`,
  `gfx_tile_level_5_wall_vertical`, `gfx_tile_level_5_wall_w`, `gfx_tile_level_5_wall_w_tjoint`,
  `gfx_tile_teleporter_00`, `gfx_title_01`, `gfx_title_02`, `gfx_title_03`, `gfx_title_04`, `gfx_title_05`,
  `gfx_title_06`, `gfx_title_07`, `gfx_title_08`, `gfx_title_09`, `gfx_title_10`, `gfx_title_11`, `gfx_title_12`,
  `gfx_title_13`, `gfx_title_14`, `gfx_title_15`, `gfx_title_16`, `gfx_title_17`, `gfx_title_18`, `gfx_title_kang`,
  `gfx_trouble_in_line_world_crosshairs_green`, `gfx_trouble_in_line_world_crosshairs_red`,
  `gfx_trouble_in_line_world_ship_00`, `gfx_trouble_in_line_world_ship_01`, `gfx_trouble_in_line_world_ship_02`,
  `gfx_trouble_in_line_world_ship_03`, `gfx_trouble_in_line_world_ship_04`, `gfx_trouble_in_line_world_ship_05`,
  `gfx_viewscreen_static1`, `gfx_viewscreen_static2`, `gfx_viewscreen_static3`, `gfx_virus_symbol_00`,
  `gfx_virus_symbol_01`, `gfx_virus_symbol_02`, `gfx_virus_symbol_selected_00`, `gfx_virus_symbol_selected_01`,
  `gfx_virus_symbol_selected_02`
];


// Every sound effect, voice clip and piece of music.
const audioAssets = [
  `sfx_aaah`, `sfx_alien_babble_babbling`, `sfx_alien_babble_hit`, `sfx_beammeup`, `sfx_bogaz_car`, `sfx_bogaz_crash`,
  `sfx_bogaz_honk`, `sfx_bounce`, `sfx_bounce_2`, `sfx_caching`, `sfx_chomp`, `sfx_cosmic_squirrel_walking`,
  `sfx_death`, `sfx_engineer_diverter`, `sfx_engineer_particle_bad`, `sfx_engineer_particle_emerging`,
  `sfx_engineer_particle_good`, `sfx_explosion`, `sfx_far_out_fowl_catch`, `sfx_far_out_fowl_chicken`,
  `sfx_ffopir_sirtet_paehc_landed_clear`, `sfx_ffopir_sirtet_paehc_rotating`, `sfx_game_exit_sound`, `sfx_heartbeat_1`,
  `sfx_heartbeat_2`, `sfx_ins_arrow`, `sfx_jump`, `sfx_laser`, `sfx_lepar_land_moaning`, `sfx_misc_1`, `sfx_misc_2`,
  `sfx_misc_3`, `sfx_misc_4`, `sfx_misc_5`, `sfx_missed`, `sfx_missile_firing`, `sfx_move`, `sfx_muncher_dude_aliens`,
  `sfx_muncher_dude_bite`, `sfx_music_brenda`, `sfx_music_catrina`, `sfx_music_eeger`, `sfx_music_fred`,
  `sfx_music_sully`, `sfx_music_theme`, `sfx_music_won`, `sfx_no_match`, `sfx_ship`, `sfx_son_of_eliminator_down`,
  `sfx_son_of_eliminator_remove`, `sfx_son_of_eliminator_up`, `sfx_splat`, `sfx_squishem_alien_popup`,
  `sfx_squishem_laser`, `sfx_squishem_squish`, `sfx_squishem_switch_groups`, `sfx_tank`, `sfx_thank_you`,
  `sfx_the_escape_levelup`, `sfx_the_escape_push`, `sfx_the_redeye_order_move`, `sfx_the_redeye_order_win`,
  `sfx_title_background`, `sfx_title_crash`, `sfx_title_gentoo_bhahaha`, `sfx_title_krelmac_ohgeez`, `sfx_tone_a`,
  `sfx_tone_b`, `sfx_tone_c`, `sfx_tone_d`, `sfx_unflip`, `sfx_unlockcode`, `sfx_voice_gentoo_01`,
  `sfx_voice_gentoo_05`, `sfx_voice_gentoo_06`, `sfx_voice_gentoo_07`, `sfx_voice_gentoo_08`, `sfx_voice_gentoo_09`,
  `sfx_voice_gentoo_12`, `sfx_voice_gentoo_13`, `sfx_voice_gentoo_15`, `sfx_voice_gentoo_17`, `sfx_voice_gentoo_20`,
  `sfx_voice_krelmac_01`, `sfx_voice_krelmac_04`, `sfx_voice_krelmac_05`, `sfx_voice_krelmac_06`,
  `sfx_voice_krelmac_07`, `sfx_voice_krelmac_08`, `sfx_voice_krelmac_12`, `sfx_voice_krelmac_13`,
  `sfx_voice_krelmac_15`, `sfx_voice_krelmac_16`, `sfx_walking`, `sfx_win_1`, `sfx_win_2`, `sfx_zap`
];


// Every OASIS cut scene script.  These are the original binary files, unaltered, loaded from scripts/<name>.oss.
// In the original each was a resource with an ID such as OSS_THE_ADVENTURE_BEGINS.  See CutScene.js.
const scriptAssets = [
  `script_the_adventure_begins`, `script_player_died`, `script_win`
];


// The maps of the five levels of the ship.  These are the original binary files, unaltered, loaded from
// maps/<name>.map.  Each is 2,704 bytes: one for each tile of a map 52 tiles wide and 52 high.  See
// WalkingAroundTheShipScene.js.
const mapAssets = [
  `level_1`, `level_2`, `level_3`, `level_4`, `level_5`
];


// Other original binary files, loaded from data/<name>.dat.  There is just the one: the order in which the pixels
// are blacked out when the screen dissolves between levels of the ship.
const dataAssets = [
  `dissolve`
];


// The conversations with the five captives, one file each.  These are the original binary files, unaltered,
// loaded from character_interactions/<name>.cid.  The order is the order of the levels of the ship.  See
// CharacterInteractionScene.js for what is in them.
const interactionAssets = [
  `eeger`, `frederick_j_smiley`, `catrina`, `brenda_bubey`, `sully`
];
